import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { Database } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { format, eachDayOfInterval } from 'date-fns';

type Transaction = Database['public']['Tables']['transactions']['Row'];

type IncomeExpenseBarProps = {
  transactions: Transaction[];
  currentPeriod: { start: Date; end: Date };
};

export default function IncomeExpenseBar({ transactions, currentPeriod }: IncomeExpenseBarProps) {
  const data = useMemo(() => {
    // Generate an array of days in the current period
    // If the period is long (e.g. custom range over a month), grouping by week might be better,
    // but we'll stick to days for simplicity here, or we can just group by "Income" and "Expense" totals if it's a simple comparison.
    // Wait, let's just make it a simple aggregated bar chart if we don't need daily breakdowns here,
    // or we can aggregate by week/day.
    // Let's do a Daily Income/Expense bar chart for the period!
    
    const days = eachDayOfInterval({ start: currentPeriod.start, end: currentPeriod.end });
    
    const dailyData = days.map(day => {
      const dayStr = day.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(t => t.date.startsWith(dayStr));
      
      let income = 0;
      let expense = 0;
      
      dayTransactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expense += t.amount;
      });
      
      return {
        date: format(day, 'MMM d'),
        income,
        expense,
      };
    });

    // filter out days where both are 0 to keep the chart clean, unless it's too small
    const activeDays = dailyData.filter(d => d.income > 0 || d.expense > 0);
    
    // If no active days, just return an empty array
    if (activeDays.length === 0) return [];

    return dailyData; // return all days to show the timeline
  }, [transactions, currentPeriod]);

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center h-[350px]">
        <p className="text-muted-foreground text-sm">No transactions in this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-[350px] flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-4">Cash Flow</h3>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value}`}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
              formatter={(value: any) => formatCurrency(value as number)}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
