import { useState, useMemo } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { useTransactions } from '../lib/hooks/useTransactions';
import { useCategories } from '../lib/hooks/useCategories';
import { useAccounts } from '../lib/hooks/useAccounts';
import { formatCurrency } from '../lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  Search, 
  Trash2, 
  Edit3, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Calculator
} from 'lucide-react';
import TransactionModal from '../components/transactions/TransactionModal';
import ConfirmModal from '../components/shared/ConfirmModal';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function TransactionsPage() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);

  // 1. Account Filtering & Active Month Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let earned = 0;
    let spent = 0;

    // Filter transactions to the selected account for stats
    const accountTxs = transactions.filter(t => {
      if (selectedAccountId === 'all') return true;
      return t.account_id === selectedAccountId || t.linked_transfer_id === selectedAccountId;
    });

    // Sum monthly earned & spent specifically inside this account
    accountTxs.forEach(t => {
      const txDate = new Date(t.date);
      if (txDate >= monthStart && txDate <= monthEnd) {
        if (t.type === 'income') {
          earned += t.amount;
        } else if (t.type === 'expense') {
          spent += t.amount;
        } else if (t.type === 'transfer') {
          if (t.notes === 'incoming') {
            earned += t.amount;
          } else if (t.notes === 'outgoing') {
            spent += t.amount;
          } else {
            // Fallback for legacy transfers
            if (selectedAccountId !== 'all' && t.account_id === selectedAccountId) {
              spent += t.amount;
            }
          }
        }
      }
    });

    return { earned, spent };
  }, [transactions, selectedAccountId]);

  // 2. Filter & Search matching list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Account filter
      const matchesAccount = selectedAccountId === 'all' 
        ? true 
        : (t.account_id === selectedAccountId || t.linked_transfer_id === selectedAccountId);

      // Type filter
      const matchesType = selectedType === 'all' ? true : t.type === selectedType;

      // Search term
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesAccount && matchesType && matchesSearch;
    });
  }, [transactions, selectedAccountId, selectedType, searchTerm]);

  // 3. Compute Sub-Total of listed (filtered) transactions
  const subTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
      if (t.type === 'transfer') {
        if (t.notes === 'incoming') {
          return sum + t.amount;
        } else if (t.notes === 'outgoing') {
          return sum - t.amount;
        } else {
          // Fallback for legacy transfers
          if (selectedAccountId !== 'all' && t.account_id === selectedAccountId) {
            return sum - t.amount;
          }
        }
      }
      return sum;
    }, 0);
  }, [filteredTransactions, selectedAccountId]);

  // Actions: DELETE trigger
  const handleDeleteClick = (id: string) => {
    setTransactionToDeleteId(id);
  };

  // Actions: DELETE confirmed execute
  const handleConfirmDelete = async () => {
    if (!transactionToDeleteId) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionToDeleteId);

      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      console.error('Delete error:', err);
    } finally {
      setTransactionToDeleteId(null);
    }
  };

  // Actions: EDIT
  const handleEditClick = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
      case 'expense': return <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
      case 'transfer': return <ArrowRightLeft className="h-3.5 w-3.5 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <PageContainer>
      {/* Brand & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Ledger</h1>
          <p className="mt-1 text-muted-foreground text-sm">Review, filter, edit, and audit your account entries.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm self-start md:self-auto text-sm"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Transaction
        </button>
      </div>

      {/* Account Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/80 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedAccountId('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedAccountId === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm font-black'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          All Accounts
        </button>
        {accounts.map(acc => (
          <button
            key={acc.id}
            onClick={() => setSelectedAccountId(acc.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedAccountId === acc.id
                ? 'bg-primary text-primary-foreground shadow-sm font-black'
                : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: acc.color }}></div>
            {acc.name}
          </button>
        ))}
      </div>

      {/* Statistics Banner per Account */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-3xl p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Earned (This Month)</p>
            <h4 className="text-lg font-black text-foreground mt-0.5">{formatCurrency(stats.earned)}</h4>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 shrink-0">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Spent (This Month)</p>
            <h4 className="text-lg font-black text-foreground mt-0.5">{formatCurrency(stats.spent)}</h4>
          </div>
        </div>

        <div className="bg-[#12221a] dark:bg-[#0c1611] border border-[#234233]/45 rounded-3xl p-4 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Listed Sub-Total</p>
            <h4 className="text-lg font-black text-white mt-0.5">{formatCurrency(subTotal)}</h4>
          </div>
        </div>
      </div>

      {/* Ledger Container */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-320px)]">
        {/* Filters Bar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/75"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex bg-muted rounded-xl p-1 gap-0.5 shrink-0 self-start sm:self-auto">
            {(['all', 'income', 'expense', 'transfer'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                  selectedType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0 backdrop-blur-sm z-10 border-b border-border/80">
              <tr>
                <th className="px-6 py-3 font-semibold tracking-wider">Date</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Description</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Category</th>
                <th className="px-6 py-3 font-semibold tracking-wider">Account</th>
                <th className="px-6 py-3 font-semibold tracking-wider text-right">Amount</th>
                <th className="px-6 py-3 font-semibold tracking-wider text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium">
                    No transactions found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const category = categories.find(c => c.id === tx.category_id);
                  const account = accounts.find(a => a.id === tx.account_id);
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-3.5 whitespace-nowrap text-muted-foreground font-medium">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isTransfer ? 'bg-amber-500/10' : tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                            {getTypeIcon(tx.type)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{tx.description}</span>
                            {tx.notes && tx.notes !== 'incoming' && tx.notes !== 'outgoing' && (
                              <span className="text-[10px] text-muted-foreground/80 mt-0.5">{tx.notes}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {isTransfer ? (
                          <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="text-blue-500 text-[10px] font-bold">Transfer</span>
                          </div>
                        ) : category ? (
                          <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/40 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }}></span>
                            <span className="text-foreground text-[10px] font-semibold">{category.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-foreground font-medium">
                        {account?.name || 'Unknown'}
                      </td>
                      <td className={`px-6 py-3.5 whitespace-nowrap text-right font-black ${
                        tx.type === 'income' || (tx.type === 'transfer' && tx.notes === 'incoming')
                          ? 'text-emerald-500' 
                          : tx.type === 'expense' || (tx.type === 'transfer' && tx.notes === 'outgoing')
                          ? 'text-red-500' 
                          : 'text-muted-foreground'
                      }`}>
                        {tx.type === 'income' || (tx.type === 'transfer' && tx.notes === 'incoming') ? '+' : ''}
                        {tx.type === 'expense' || (tx.type === 'transfer' && tx.notes === 'outgoing') ? '-' : ''}
                        {formatCurrency(tx.amount)}
                      </td>
                      {/* Actions CRUD inline buttons */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(tx)}
                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Edit entry"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tx.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        categories={categories} 
        accounts={accounts} 
        transactionToEdit={transactionToEdit}
      />

      <ConfirmModal 
        isOpen={transactionToDeleteId !== null}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction? This will permanently update account balances."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTransactionToDeleteId(null)}
        variant="danger"
      />
    </PageContainer>
  );
}
