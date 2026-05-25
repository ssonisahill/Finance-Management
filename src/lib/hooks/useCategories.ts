import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { Database } from '../types';

type Category = Database['public']['Tables']['categories']['Row'];

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();

    const channel = supabase
      .channel(`schema-db-changes-categories-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { categories, loading };
}
