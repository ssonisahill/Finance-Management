import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import type { Database } from '../../lib/types';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];

type RecentTransactionsProps = {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
};

export default function RecentTransactions({ transactions, categories, accounts }: RecentTransactionsProps) {
  const recentTxs = transactions.slice(0, 5); // Take top 5

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
      case 'expense':
        return <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
      case 'transfer':
        return <ArrowRightLeft className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getAmountStyle = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-emerald-500 font-bold text-sm';
      case 'expense':
        return 'text-red-500 font-bold text-sm';
      case 'transfer':
        return 'text-muted-foreground font-semibold text-sm';
      default:
        return 'text-foreground font-bold text-sm';
    }
  };

  if (recentTxs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center h-[350px]">
        <p className="text-muted-foreground text-sm font-medium">No recent transactions.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-[350px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Transactions</h3>
        <Link 
          to="/transactions" 
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {recentTxs.map(tx => {
          const category = categories.find(c => c.id === tx.category_id);
          const account = accounts.find(a => a.id === tx.account_id);
          const isTransfer = tx.type === 'transfer';
          
          return (
            <div key={tx.id} className="flex items-center justify-between p-2.5 border border-border/30 rounded-2xl bg-muted/10 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-xl shrink-0 ${isTransfer ? 'bg-amber-500/10' : tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {getTypeIcon(tx.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-xs truncate leading-tight">{tx.description}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                    <span>{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span className="truncate">{account?.name || 'Account'}</span>
                    {!isTransfer && category && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }}></span>
                          {category.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-right shrink-0 ml-2 ${getAmountStyle(tx.type)}`}>
                {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                {formatCurrency(tx.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
