import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  account_id: string;
  created_at: string;
}

export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    const fetchSubscriptions = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('due_day', { ascending: true });

      if (!error && data) {
        setSubscriptions(data as Subscription[]);
      }
      setLoading(false);
    };

    fetchSubscriptions();

    // Subscribe to real-time changes with unique channel name to avoid multi-instance conflicts
    const channel = supabase
      .channel(`schema-db-changes-subscriptions-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { subscriptions, loading };
}
