import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  DockItemId,
  DEFAULT_DOCK_ITEMS,
  MAX_DOCK_ITEMS,
  MIN_DOCK_ITEMS,
  isValidDockItem,
  getNavItem,
} from '@/constants/nav-items';

export interface DockConfig {
  version: number;
  items: DockItemId[];
  device_override: boolean;
}

interface DockStore {
  config: DockConfig;
  loading: boolean;
  error: string | null;

  loadConfig: (userId: string) => Promise<void>;
  saveConfig: (userId: string, items: DockItemId[]) => Promise<boolean>;
  resetToDefaults: (userId: string) => Promise<boolean>;
  reorderItems: (items: DockItemId[]) => void;
  addItem: (item: DockItemId) => boolean;
  removeItem: (item: DockItemId) => boolean;
  canAddItem: () => boolean;
  validateConfig: (items: DockItemId[]) => boolean;
}

const DEFAULT_CONFIG: DockConfig = {
  version: 1,
  items: DEFAULT_DOCK_ITEMS,
  device_override: false,
};

export const useDockStore = create<DockStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  loading: false,
  error: null,

  loadConfig: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tab_config')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.tab_config) {
        const config = data.tab_config as DockConfig;

        const validatedItems = config.items.filter(isValidDockItem);

        if (validatedItems.length === 0) {
          set({ config: DEFAULT_CONFIG, loading: false });
          return;
        }

        set({
          config: {
            ...config,
            items: validatedItems,
          },
          loading: false,
        });
      } else {
        set({ config: DEFAULT_CONFIG, loading: false });
      }
    } catch (error) {
      console.error('Error loading dock config:', error);
      set({
        error: 'Failed to load dock configuration',
        config: DEFAULT_CONFIG,
        loading: false,
      });
    }
  },

  saveConfig: async (userId: string, items: DockItemId[]) => {
    const { validateConfig } = get();

    if (!validateConfig(items)) {
      set({ error: 'Invalid dock configuration' });
      return false;
    }

    try {
      const newConfig: DockConfig = {
        version: 1,
        items,
        device_override: false,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ tab_config: newConfig })
        .eq('id', userId);

      if (error) throw error;

      set({ config: newConfig, error: null });

      return true;
    } catch (error) {
      console.error('Error saving dock config:', error);
      set({ error: 'Failed to save dock configuration' });
      return false;
    }
  },

  resetToDefaults: async (userId: string) => {
    try {
      const defaultConfig: DockConfig = {
        version: 1,
        items: DEFAULT_DOCK_ITEMS,
        device_override: false,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ tab_config: defaultConfig })
        .eq('id', userId);

      if (error) throw error;

      set({ config: defaultConfig, error: null });

      return true;
    } catch (error) {
      console.error('Error resetting dock config:', error);
      set({ error: 'Failed to reset dock configuration' });
      return false;
    }
  },

  reorderItems: (items: DockItemId[]) => {
    const { config } = get();
    set({
      config: {
        ...config,
        items,
      },
    });
  },

  addItem: (item: DockItemId) => {
    const { config, canAddItem } = get();

    if (!canAddItem()) {
      set({ error: `Cannot add more than ${MAX_DOCK_ITEMS} items` });
      return false;
    }

    if (config.items.includes(item)) {
      return false;
    }

    if (!getNavItem(item)) {
      set({ error: 'Invalid navigation item' });
      return false;
    }

    set({
      config: {
        ...config,
        items: [...config.items, item],
      },
      error: null,
    });

    return true;
  },

  removeItem: (item: DockItemId) => {
    const { config } = get();

    if (item === 'home') {
      set({ error: 'Cannot remove Home tab' });
      return false;
    }

    if (item === 'more') {
      set({ error: 'Cannot remove More tab' });
      return false;
    }

    if (config.items.length <= MIN_DOCK_ITEMS) {
      set({ error: `Must have at least ${MIN_DOCK_ITEMS} tabs` });
      return false;
    }

    set({
      config: {
        ...config,
        items: config.items.filter(id => id !== item),
      },
      error: null,
    });

    return true;
  },

  canAddItem: () => {
    const { config } = get();
    return config.items.length < MAX_DOCK_ITEMS;
  },

  validateConfig: (items: DockItemId[]) => {
    if (items.length < MIN_DOCK_ITEMS || items.length > MAX_DOCK_ITEMS) {
      return false;
    }

    if (!items.every(isValidDockItem)) {
      return false;
    }

    const uniqueItems = new Set(items);
    if (uniqueItems.size !== items.length) {
      return false;
    }

    if (!items.includes('home') || !items.includes('more')) {
      return false;
    }

    return true;
  },
}));
