import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Database } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks/useAuth';

type Category = Database['public']['Tables']['categories']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  transactionToEdit?: Transaction | null; // Optional transaction for Editing
};

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  categories, 
  accounts,
  transactionToEdit = null
}: TransactionModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        // Mode: EDITING transaction
        setType(transactionToEdit.type);
        setAmount(transactionToEdit.amount.toString());
        setDescription(transactionToEdit.description);
        setNotes(transactionToEdit.notes && transactionToEdit.notes !== 'incoming' && transactionToEdit.notes !== 'outgoing' ? transactionToEdit.notes : '');
        setDate(transactionToEdit.date);
        setAccountId(transactionToEdit.account_id);
        setCategoryId(transactionToEdit.category_id || '');
        setToAccountId(transactionToEdit.linked_transfer_id || '');
      } else {
        // Mode: CREATING new transaction
        setType('expense');
        setAmount('');
        setDescription('');
        setNotes('');
        setDate(new Date().toISOString().split('T')[0]);
        setAccountId(accounts[0]?.id || '');
        setCategoryId(categories[0]?.id || '');
        setToAccountId(accounts[1]?.id || '');
      }
    }
  }, [isOpen, accounts, categories, transactionToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !accountId) return;

    setIsSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);

      if (transactionToEdit) {
        // ------------------ UPDATE MODE ------------------
        const { error } = await supabase
          .from('transactions')
          .update({
            account_id: accountId,
            category_id: type === 'transfer' ? null : (categoryId || null),
            type: type,
            amount: parsedAmount,
            description: description || (type === 'income' ? 'Income' : 'Expense'),
            date: date,
            notes: type === 'transfer' ? transactionToEdit.notes : (notes || null),
          } as any)
          .eq('id', transactionToEdit.id);

        if (error) throw error;
      } else {
        // ------------------ INSERT MODE ------------------
        if (type === 'transfer') {
          if (!toAccountId || accountId === toAccountId) {
            alert('Please select a valid destination account.');
            setIsSubmitting(false);
            return;
          }

          // Use the RPC for transfers
          const { error } = await supabase.rpc('create_transfer', {
            p_user_id: user.id,
            p_source_account_id: accountId,
            p_dest_account_id: toAccountId,
            p_amount: parsedAmount,
            p_date: date,
            p_description: description || 'Transfer'
          });

          if (error) throw error;

        } else {
          // Standard income/expense
          const { error } = await supabase.from('transactions').insert([{
            user_id: user.id,
            account_id: accountId,
            category_id: categoryId || null,
            type: type,
            amount: parsedAmount,
            description: description || (type === 'income' ? 'Income' : 'Expense'),
            date: date,
            notes: notes || null,
          } as any]);

          if (error) throw error;
        }
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Selector (Disabled in EDIT mode if it's a Transfer to preserve consistency) */}
          <div className="flex bg-muted rounded-lg p-1">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button
                key={t}
                type="button"
                disabled={!!transactionToEdit && transactionToEdit.type === 'transfer' && t !== 'transfer'}
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                  type === t 
                    ? t === 'expense' ? 'bg-red-500 text-white shadow' : t === 'income' ? 'bg-emerald-500 text-white shadow' : 'bg-blue-500 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground disabled:opacity-55'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <input 
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Accounts */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                {type === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select 
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            
            {type === 'transfer' && !transactionToEdit && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1">To Account</label>
                <select 
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Category (hidden for transfers) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <select 
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              >
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Date & Description */}
          <div className="flex gap-4">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-foreground mb-1">Date</label>
              <input 
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <input 
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What was this for?"
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add custom notes or details..."
                rows={2}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm resize-none"
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : transactionToEdit ? 'Save Changes' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
