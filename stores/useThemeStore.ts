import { create } from 'zustand';
import { Colors } from '@/constants/theme';

interface ThemeStore {
  mode: 'light' | 'dark';
  theme: 'light' | 'dark';
  colors: typeof Colors.light;
  setMode: (mode: 'light' | 'dark') => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'dark',
  theme: 'dark',
  colors: Colors.dark,

  setMode: (mode) =>
    set({
      mode,
      theme: mode,
      colors: mode === 'light' ? Colors.light : Colors.dark,
    }),

  toggleMode: () => {
    const currentMode = get().mode;
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    set({
      mode: newMode,
      theme: newMode,
      colors: newMode === 'light' ? Colors.light : Colors.dark,
    });
  },
}));
