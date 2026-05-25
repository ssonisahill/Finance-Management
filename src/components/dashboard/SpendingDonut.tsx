import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Database } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type SpendingDonutProps = {
  transactions: Transaction[];
  categories: Category[];
};

export default function SpendingDonut({ transactions, categories }: SpendingDonutProps) {
  const { data, total, topCategoryName } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(t => {
      const catId = t.category_id || 'uncategorized';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + t.amount;
    });

    const list = Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          name: cat?.name || 'Uncategorized',
          value: amount,
          color: cat?.color || '#9ca3af',
        };
      })
      .sort((a, b) => b.value - a.value); // sort largest to smallest

    const sum = list.reduce((acc, curr) => acc + curr.value, 0);
    const topCatName = list[0]?.name || 'None';

    return { data: list, total: sum, topCategoryName: topCatName };
  }, [transactions, categories]);

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center h-[350px]">
        <p className="text-muted-foreground text-sm font-medium">No expenses in this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-[350px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Spending Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total spent: <strong className="text-foreground font-semibold">{formatCurrency(total)}</strong>
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-1">
        {/* Left side: Donut Chart */}
        <div className="w-full sm:w-[45%] h-[200px] relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius="65%"
                outerRadius="85%"
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => formatCurrency(value as number)}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Top Category</span>
            <span className="text-xs font-bold text-foreground truncate max-w-[85%] mt-0.5">{topCategoryName}</span>
          </div>
        </div>

        {/* Right side: Categories lists with exact mockup styling */}
        <div className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {data.slice(0, 5).map((item) => {
            const percent = ((item.value / (total || 1)) * 100).toFixed(0);
            return (
              <div key={item.name} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-b-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-foreground truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-muted-foreground font-medium">{formatCurrency(item.value)}</span>
                  <span className="font-bold text-foreground min-w-[30px]">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
