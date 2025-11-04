import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AppConfig {
  app_name: string;
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  trading_enabled: boolean;
  bots_enabled: boolean;
}

export function useAppConfig(): AppConfig & { loading: boolean } {
  const [config, setConfig] = useState<AppConfig>({
    app_name: 'Trading Platform',
    maintenance_mode: false,
    allow_new_registrations: true,
    trading_enabled: true,
    bots_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any;

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_configuration')
          .select('key, value')
          .in('key', [
            'app_name',
            'maintenance_mode',
            'allow_new_registrations',
            'trading_enabled',
            'bots_enabled',
          ]);

        if (error) {
          console.error('Error fetching app configuration:', error);
        } else if (data) {
          const configMap = data.reduce((acc, item) => {
            acc[item.key as keyof AppConfig] = item.value;
            return acc;
          }, {} as Partial<AppConfig>);

          setConfig((prev) => ({ ...prev, ...configMap }));
        }
      } catch (err) {
        console.error('Error fetching app configuration:', err);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSync = () => {
      channel = supabase
        .channel('app-config-sync')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'app_configuration',
          },
          (payload: any) => {
            if (payload.new && payload.new.key) {
              setConfig((prev) => ({
                ...prev,
                [payload.new.key]: payload.new.value,
              }));
            }
          }
        )
        .subscribe();
    };

    fetchConfig();
    setupRealtimeSync();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { ...config, loading };
}

export function useConfigValue<T = any>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any;

    const fetchValue = async () => {
      try {
        const { data, error } = await supabase
          .from('app_configuration')
          .select('value')
          .eq('key', key)
          .single();

        if (error) {
          console.error(`Error fetching config ${key}:`, error);
          setValue(defaultValue);
        } else {
          setValue(data?.value || defaultValue);
        }
      } catch (err) {
        console.error(`Error fetching config ${key}:`, err);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSync = () => {
      channel = supabase
        .channel(`config-${key}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'app_configuration',
            filter: `key=eq.${key}`,
          },
          (payload: any) => {
            setValue(payload.new.value || defaultValue);
          }
        )
        .subscribe();
    };

    fetchValue();
    setupRealtimeSync();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [key, defaultValue]);

  return value;
}
