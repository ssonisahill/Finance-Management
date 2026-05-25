import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { Database } from '../types';

export type Transaction = Database['public']['Tables']['transactions']['Row'];

export function useTransactions(period?: { start: Date; end: Date }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (period) {
        // format to YYYY-MM-DD
        const startStr = period.start.toISOString().split('T')[0];
        const endStr = period.end.toISOString().split('T')[0];
        query = query.gte('date', startStr).lte('date', endStr);
      }

      const { data, error } = await query;

      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();

    const channel = supabase
      .channel(`schema-db-changes-transactions-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch to ensure order and filtering are correct
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, period?.start.toISOString(), period?.end.toISOString()]);

  return { transactions, loading };
}
