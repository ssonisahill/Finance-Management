import { useState, useMemo } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { usePreferences } from '../lib/hooks/usePreferences';
import { useAccounts } from '../lib/hooks/useAccounts';
import { useCategories } from '../lib/hooks/useCategories';
import { useSubscriptions } from '../lib/hooks/useSubscriptions';
import { useTransactions } from '../lib/hooks/useTransactions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/hooks/useAuth';
import { Trash2, Plus, Check, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/shared/ConfirmModal';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { subscriptions } = useSubscriptions();

  // Fetch transactions for the current calendar month to check payment status
  const today = useMemo(() => new Date(), []);
  const startOfMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const endOfMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);
  
  const currentMonthPeriod = useMemo(() => ({
    start: startOfMonth,
    end: endOfMonth
  }), [startOfMonth, endOfMonth]);

  const { transactions } = useTransactions(currentMonthPeriod);

  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDueDay, setSubDueDay] = useState('5');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subAccountId, setSubAccountId] = useState('');
  const [subToDeleteId, setSubToDeleteId] = useState<string | null>(null);
  const [loggingSubId, setLoggingSubId] = useState<string | null>(null);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subName || !subAmount || !subAccountId) return;

    const { error } = await supabase.from('subscriptions').insert([{
      user_id: user.id,
      name: subName,
      amount: parseFloat(subAmount) || 0,
      due_day: parseInt(subDueDay) || 5,
      category_id: subCategoryId || null,
      account_id: subAccountId
    }]);

    if (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to add subscription: ' + error.message);
      return;
    }

    setSubName('');
    setSubAmount('');
    setSubDueDay('5');
    setSubCategoryId('');
    setSubAccountId('');
    window.location.reload();
  };

  const handleDeleteSubscriptionClick = (id: string) => {
    setSubToDeleteId(id);
  };

  const handleConfirmDeleteSubscription = async () => {
    if (!subToDeleteId) return;
    const { error } = await supabase.from('subscriptions').delete().eq('id', subToDeleteId);
    if (error) {
      console.error('Delete subscription error:', error);
    }
    setSubToDeleteId(null);
    window.location.reload();
  };

  const handleLogPayment = async (sub: any) => {
    if (!user) return;
    setLoggingSubId(sub.id);
    try {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const maxDaysThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dueDayClamped = Math.min(sub.due_day, maxDaysThisMonth);
      
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dueDayClamped).padStart(2, '0')}`;

      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id,
        account_id: sub.account_id,
        type: 'expense',
        description: `Subscription: ${sub.name}`,
        amount: sub.amount,
        category_id: sub.category_id || null,
        date: dateStr,
        is_recurring: true,
        notes: `[Sub: ${sub.id}]`
      }]);

      if (error) {
        console.error('Error logging subscription payment:', error);
        alert('Failed to log payment: ' + error.message);
      }
    } catch (err: any) {
      console.error('Exception logging subscription:', err);
    } finally {
      setLoggingSubId(null);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-muted-foreground text-sm">Manage your monthly recurring bills and subscriptions.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <form onSubmit={handleCreateSubscription} className="bg-muted/20 p-4 rounded-2xl border border-border/80 space-y-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Bill Name</label>
              <input 
                type="text"
                required
                value={subName}
                onChange={e => setSubName(e.target.value)}
                placeholder="e.g. Netflix Premium"
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal placeholder:text-muted-foreground/75"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Monthly Amount</label>
              <input 
                type="number"
                required
                value={subAmount}
                onChange={e => setSubAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Due Day (1-31)</label>
              <input 
                type="number"
                min="1"
                max="31"
                required
                value={subDueDay}
                onChange={e => setSubDueDay(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Debit Account</label>
              <select
                required
                value={subAccountId}
                onChange={e => setSubAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold"
              >
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Category (Optional)</label>
              <select
                value={subCategoryId}
                onChange={e => setSubCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold"
              >
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs">
              <Plus className="h-4 w-4" /> Add Subscription
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {today.toLocaleString('default', { month: 'long' })} Payment Tracker
            </h3>
            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-normal">
              {subscriptions.filter(sub => transactions.some(t => t.notes === `[Sub: ${sub.id}]`)).length} / {subscriptions.length} Paid
            </span>
          </div>

          {subscriptions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-4 bg-muted/10 rounded-2xl border border-dashed border-border/80 text-center">
              No recurring bills added yet. Manage subscriptions above to warn AI of upcoming cash deductions!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {subscriptions.map(sub => {
                const acc = accounts.find(a => a.id === sub.account_id);
                const cat = categories.find(c => c.id === sub.category_id);
                const linkedTransaction = transactions.find(t => t.notes === `[Sub: ${sub.id}]`);
                const isPaid = !!linkedTransaction;
                const isLogging = loggingSubId === sub.id;

                return (
                  <div 
                    key={sub.id} 
                    className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 ${
                      isPaid 
                        ? 'border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' 
                        : 'border-border/60 bg-muted/10 hover:border-border/90'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                        {sub.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5 items-center">
                        <span>Due Day {sub.due_day}</span>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="truncate">{acc?.name || 'Account'}</span>
                        {cat && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="truncate text-primary/85">{cat.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3.5 shrink-0 ml-auto">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-extrabold text-red-500 tracking-tight">
                          -{preferences?.currency || '₹'}{sub.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPaid ? (
                          <span 
                            title={`Logged on ${linkedTransaction.date}`}
                            className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs select-none"
                          >
                            <Check className="h-3 w-3 stroke-[3px]" /> Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLogPayment(sub)}
                            disabled={isLogging}
                            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                          >
                            {isLogging ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Log Payment'
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteSubscriptionClick(sub.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={subToDeleteId !== null}
        title="Delete Subscription?"
        message="Are you sure you want to delete this recurring subscription? This will stop future AI forecasts."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteSubscription}
        onCancel={() => setSubToDeleteId(null)}
        variant="danger"
      />
    </PageContainer>
  );
}
