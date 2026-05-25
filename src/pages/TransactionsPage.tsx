import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { useTransactions } from '../lib/hooks/useTransactions';
import { useCategories } from '../lib/hooks/useCategories';
import { useAccounts } from '../lib/hooks/useAccounts';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Search, Filter } from 'lucide-react';
import TransactionModal from '../components/transactions/TransactionModal';

export default function TransactionsPage() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'expense': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case 'transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income': return 'text-green-500 font-semibold';
      case 'expense': return 'text-foreground font-semibold';
      case 'transfer': return 'text-muted-foreground font-medium';
      default: return 'text-foreground';
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="mt-1 text-muted-foreground">Manage your income, expenses, and transfers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Transaction
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="p-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Filter</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 font-medium border-b border-border">Date</th>
                <th className="px-6 py-3 font-medium border-b border-border">Description</th>
                <th className="px-6 py-3 font-medium border-b border-border">Category</th>
                <th className="px-6 py-3 font-medium border-b border-border">Account</th>
                <th className="px-6 py-3 font-medium border-b border-border text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const category = categories.find(c => c.id === tx.category_id);
                  const account = accounts.find(a => a.id === tx.account_id);
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full shrink-0 ${isTransfer ? 'bg-blue-500/10' : tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {getTypeIcon(tx.type)}
                          </div>
                          <span className="font-medium text-foreground">{tx.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!isTransfer && category ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }}></span>
                            <span className="text-foreground">{category.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">
                        {account?.name || 'Unknown'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right ${getAmountColor(tx.type)}`}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount)}
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
        onClose={() => setIsModalOpen(false)} 
        categories={categories} 
        accounts={accounts} 
      />
    </PageContainer>
  );
}
