import { useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import type { Database } from '../../lib/types';
import { ShieldAlert, CheckCircle, ShieldQuestion } from 'lucide-react';
import { usePreferences } from '../../lib/hooks/usePreferences';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type BudgetProgressWidgetProps = {
  transactions: Transaction[]; // filtered by active period
  categories: Category[];
};

export default function BudgetProgressWidget({ transactions, categories }: BudgetProgressWidgetProps) {
  const { preferences } = usePreferences();

  const budgetedCategories = useMemo(() => {
    // 1. Filter categories that have an active budget limit
    const activeBudgets = categories.filter(c => c.budget_limit !== null && c.budget_limit > 0);

    // 2. Sum expenses for each budgeted category in this period
    const expenses = transactions.filter(t => t.type === 'expense');

    return activeBudgets.map(cat => {
      const spent = expenses
        .filter(t => t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const budget = cat.budget_limit || 1; // Safeguard division by zero
      const ratio = spent / budget;
      const percent = Math.min(Math.round(ratio * 100), 150); // Cap visual bar at 150%

      let barColor = 'bg-emerald-500';
      let textColor = 'text-emerald-500';
      let status: 'safe' | 'warning' | 'exceeded' = 'safe';

      if (ratio >= 1.0) {
        barColor = 'bg-red-500 animate-pulse';
        textColor = 'text-red-500 font-extrabold';
        status = 'exceeded';
      } else if (ratio >= 0.8) {
        barColor = 'bg-amber-500';
        textColor = 'text-amber-500 font-bold';
        status = 'warning';
      }

      return {
        ...cat,
        spent,
        percent,
        ratio,
        barColor,
        textColor,
        status
      };
    }).sort((a, b) => b.ratio - a.ratio); // Sort highest usage first
  }, [transactions, categories]);

  if (budgetedCategories.length === 0) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-[350px] flex flex-col justify-between items-center text-center">
        <div className="my-auto space-y-3.5">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
            <ShieldQuestion className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Category Budget Safeguards</h4>
            <p className="text-[11px] text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
              You haven't defined any spending caps yet! 
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              Go to **Settings &gt; Categories** and set monthly limits to unlock real-time budget safety tracking.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-[350px] flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Budget Allocation</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time status of your active category limits.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2">
        {budgetedCategories.map(cat => {
          const remaining = (cat.budget_limit || 0) - cat.spent;

          return (
            <div key={cat.id} className="space-y-2">
              {/* Header Labels */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                  <span className="font-bold text-foreground truncate">{cat.name}</span>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 ml-2 font-semibold">
                  <span className="text-muted-foreground">{formatCurrency(cat.spent, preferences?.currency)}</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-foreground">{formatCurrency(cat.budget_limit || 0, preferences?.currency)}</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden border border-border/30">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${cat.barColor}`}
                  style={{ width: `${cat.percent}%` }}
                ></div>
              </div>

              {/* Status footer message */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 text-muted-foreground font-medium">
                  {cat.status === 'exceeded' ? (
                    <span className="text-red-500 flex items-center gap-1 font-bold">
                      <ShieldAlert className="h-3 w-3 shrink-0" /> Over by {formatCurrency(Math.abs(remaining), preferences?.currency)}
                    </span>
                  ) : cat.status === 'warning' ? (
                    <span className="text-amber-500 flex items-center gap-1 font-bold">
                      ⚠️ Approaching Limit • {formatCurrency(remaining, preferences?.currency)} left
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 shrink-0" /> On track • {formatCurrency(remaining, preferences?.currency)} left
                    </span>
                  )}
                </div>
                <span className={`font-black tracking-wide ${cat.textColor}`}>
                  {Math.round(cat.ratio * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
