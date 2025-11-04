import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useFeatureFlag(flagName: string): boolean {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any;

    const fetchFlag = async () => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('is_enabled')
          .eq('flag_name', flagName)
          .single();

        if (error) {
          console.error(`Error fetching feature flag ${flagName}:`, error);
          setEnabled(false);
        } else {
          setEnabled(data?.is_enabled || false);
        }
      } catch (err) {
        console.error(`Error fetching feature flag ${flagName}:`, err);
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSync = () => {
      channel = supabase
        .channel(`feature-flag-${flagName}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'feature_flags',
            filter: `flag_name=eq.${flagName}`,
          },
          (payload: any) => {
            setEnabled(payload.new.is_enabled || false);
          }
        )
        .subscribe();
    };

    fetchFlag();
    setupRealtimeSync();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [flagName]);

  return enabled;
}

export function useFeatureFlags(flagNames: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any;

    const fetchFlags = async () => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('flag_name, is_enabled')
          .in('flag_name', flagNames);

        if (error) {
          console.error('Error fetching feature flags:', error);
          const defaultFlags = flagNames.reduce((acc, name) => {
            acc[name] = false;
            return acc;
          }, {} as Record<string, boolean>);
          setFlags(defaultFlags);
        } else {
          const flagMap = data.reduce((acc, flag) => {
            acc[flag.flag_name] = flag.is_enabled;
            return acc;
          }, {} as Record<string, boolean>);
          setFlags(flagMap);
        }
      } catch (err) {
        console.error('Error fetching feature flags:', err);
        const defaultFlags = flagNames.reduce((acc, name) => {
          acc[name] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setFlags(defaultFlags);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSync = () => {
      channel = supabase
        .channel('feature-flags-multiple')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'feature_flags',
          },
          (payload: any) => {
            if (flagNames.includes(payload.new.flag_name)) {
              setFlags((prev) => ({
                ...prev,
                [payload.new.flag_name]: payload.new.is_enabled,
              }));
            }
          }
        )
        .subscribe();
    };

    fetchFlags();
    setupRealtimeSync();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [flagNames.join(',')]);

  return flags;
}
