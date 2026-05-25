import { useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import type { Database } from '../../lib/types';
import { TrendingUp, TrendingDown, PiggyBank, Percent } from 'lucide-react';

type Transaction = Database['public']['Tables']['transactions']['Row'];

type FinancialSummaryProps = {
  transactions: Transaction[]; // filtered by period
};

export default function FinancialSummary({ transactions }: FinancialSummaryProps) {
  const { totalIncome, totalExpense, netSavings, savingsRate } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.type === 'transfer') return; // Exclude transfers
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });

    const savings = income - expense;
    const rate = income > 0 ? (savings / income) * 100 : 0;

    return { totalIncome: income, totalExpense: expense, netSavings: savings, savingsRate: rate };
  }, [transactions]);

  const cards = [
    {
      label: 'Total Income',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(totalExpense),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Net Savings',
      value: formatCurrency(netSavings),
      icon: PiggyBank,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      icon: Percent,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <Icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <h4 className="text-xl font-bold text-foreground">{card.value}</h4>
            </div>
          </div>
        );
      })}
    </div>
  );
}
