import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { Database } from '../types';

type Account = Database['public']['Tables']['accounts']['Row'];

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setAccounts(data);
      }
      setLoading(false);
    };

    fetchAccounts();

    const channel = supabase
      .channel(`schema-db-changes-accounts-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { accounts, loading };
}
