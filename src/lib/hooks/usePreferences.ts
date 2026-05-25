import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { Database } from '../types';

type UserPreference = Database['public']['Tables']['user_preferences']['Row'];

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setPreferences(data);
      } else {
        // Create default preferences if none exist
        const { data: newData, error: insertError } = await supabase
          .from('user_preferences')
          .insert([
            {
              user_id: user.id,
              financial_month_start_day: 18,
              currency: '₹',
              theme: 'system' as const,
            } as any,
          ])
          .select()
          .single();

        if (!insertError && newData) {
          setPreferences(newData);
        }
      }
      setLoading(false);
    };

    fetchPreferences();

    // Subscribe to changes
    const channel = supabase
      .channel(`schema-db-changes-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setPreferences(payload.new as UserPreference);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updatePreferences = async (updates: Partial<UserPreference>) => {
    if (!user || !preferences) return;

    await supabase
      .from('user_preferences')
      .update(updates as any)
      .eq('id', preferences.id);
  };

  return { preferences, loading, updatePreferences };
}
