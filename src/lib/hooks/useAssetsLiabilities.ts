import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export type AssetLiability = {
  id: string;
  user_id: string;
  name: string;
  type: 'asset' | 'liability';
  category: string;
  value: number;
  created_at: string;
  updated_at: string;
};

export function useAssetsLiabilities() {
  const { user } = useAuth();
  const [items, setItems] = useState<AssetLiability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('assets_liabilities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data as AssetLiability[]);
      }
      setLoading(false);
    };

    fetchItems();

    const channel = supabase
      .channel(`schema-db-changes-al-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets_liabilities',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addItem = async (item: Omit<AssetLiability, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('assets_liabilities')
      .insert([{ ...item, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('assets_liabilities')
      .delete()
      .eq('id', id);
    if (error) throw error;
  };

  return { items, loading, addItem, deleteItem };
}
