import { useState, useMemo } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { useTransactions } from '../lib/hooks/useTransactions';
import { useCategories } from '../lib/hooks/useCategories';
import { useAccounts } from '../lib/hooks/useAccounts';
import SpendingDonut from '../components/dashboard/SpendingDonut';
import IncomeExpenseBar from '../components/dashboard/IncomeExpenseBar';
import { usePeriod } from '../lib/hooks/usePeriod';
import { usePreferences } from '../lib/hooks/usePreferences';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import { Wallet, Sparkles, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { preferences } = usePreferences();
  const startDay = preferences?.financial_month_start_day || 18;
  const { periodType, setPeriodType, currentPeriod, nextPeriod, prevPeriod } = usePeriod(startDay);

  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Filter transactions by period
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d >= currentPeriod.start && d <= currentPeriod.end;
    });
  }, [transactions, currentPeriod]);

  // Filter period transactions specifically by active Account selection
  const filteredPeriodTransactions = useMemo(() => {
    return periodTransactions.filter(t => {
      if (selectedAccountId === 'all') return true;
      return t.account_id === selectedAccountId || t.linked_transfer_id === selectedAccountId;
    });
  }, [periodTransactions, selectedAccountId]);

  // Calculate detailed financial metrics for selected account
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredPeriodTransactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expense += t.amount;
      } else if (t.type === 'transfer') {
        if (t.notes === 'incoming') {
          income += t.amount;
        } else if (t.notes === 'outgoing') {
          expense += t.amount;
        } else {
          // Fallback for legacy transfers
          if (selectedAccountId !== 'all' && t.account_id === selectedAccountId) {
            expense += t.amount;
          }
        }
      }
    });

    const netSavings = income - expense;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    return { income, expense, netSavings, savingsRate };
  }, [filteredPeriodTransactions, selectedAccountId]);

  // MoM Cash Flow Comparison data (Last 6 Months)
  const momCashFlowData = useMemo(() => {
    const monthsData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const label = d.toLocaleDateString('default', { month: 'short', year: '2-digit' });
      
      let income = 0;
      let expense = 0;
      
      transactions.forEach(t => {
        const txDate = new Date(t.date);
        if (txDate >= mStart && txDate <= mEnd) {
          const matchesAccount = selectedAccountId === 'all' 
            ? true 
            : t.account_id === selectedAccountId;
            
          if (matchesAccount) {
            if (t.type === 'income') {
              income += t.amount;
            } else if (t.type === 'expense') {
              expense += t.amount;
            } else if (t.type === 'transfer') {
              if (t.notes === 'incoming') {
                income += t.amount;
              } else if (t.notes === 'outgoing') {
                expense += t.amount;
              }
            }
          }
        }
      });
      
      monthsData.push({ month: label, Income: income, Expense: expense });
    }
    return monthsData;
  }, [transactions, selectedAccountId]);

  // Weekly Heatmap Data (Last 28 Days / 4 Calendar Weeks)
  const heatmapData = useMemo(() => {
    const daysList = [];
    const now = new Date();
    // Fetch last 28 days
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      
      const spent = transactions
        .filter(t => {
          const matchesAccount = selectedAccountId === 'all'
            ? true
            : t.account_id === selectedAccountId;
          const isExpense = t.type === 'expense' || (t.type === 'transfer' && t.notes === 'outgoing');
          return matchesAccount && isExpense && t.date === dStr;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      daysList.push({
        date: d,
        formattedDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        spent
      });
    }

    // Chunk into 4 weeks (7 days each)
    const weeks = [];
    for (let i = 0; i < daysList.length; i += 7) {
      weeks.push(daysList.slice(i, i + 7));
    }
    return weeks;
  }, [transactions, selectedAccountId]);

  const getHeatmapColor = (amount: number) => {
    if (amount === 0) return 'bg-muted/40 hover:bg-muted border border-border/20';
    if (amount <= 1000) return 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    if (amount <= 5000) return 'bg-emerald-500/50 hover:bg-emerald-500/60 border border-emerald-500/20 text-white';
    return 'bg-emerald-700 hover:bg-emerald-600 border border-emerald-800 text-white';
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground text-sm">Deep-dive into your financial habits and accounts analysis.</p>
        </div>
      </div>

      {/* Account Selection Tabs at the top */}
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

      {/* Period Selection Controls */}
      <PeriodSelector 
        periodType={periodType}
        setPeriodType={setPeriodType}
        currentPeriod={currentPeriod}
        nextPeriod={nextPeriod}
        prevPeriod={prevPeriod}
      />

      {/* Account-Specific Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-[9px]">Total Income</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <h4 className="text-xl font-black text-foreground mt-2">{formatCurrency(metrics.income)}</h4>
        </div>

        <div className="bg-card border border-border rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-[9px]">Total Expenses</span>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <h4 className="text-xl font-black text-foreground mt-2">{formatCurrency(metrics.expense)}</h4>
        </div>

        <div className="bg-card border border-border rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-[9px]">Net Cash Flow</span>
            <span className="text-xs font-bold text-emerald-500">Savings</span>
          </div>
          <h4 className={`text-xl font-black mt-2 ${metrics.netSavings >= 0 ? 'text-foreground' : 'text-red-500'}`}>
            {metrics.netSavings >= 0 ? '+' : ''}{formatCurrency(metrics.netSavings)}
          </h4>
        </div>

        <div className="bg-card border border-border rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-bold uppercase tracking-wider text-[9px]">Savings Rate</span>
            <Percent className="h-4 w-4 text-primary" />
          </div>
          <h4 className="text-xl font-black text-foreground mt-2">{metrics.savingsRate.toFixed(1)}%</h4>
        </div>
      </div>

      {/* Row 1: Charts Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SpendingDonut transactions={filteredPeriodTransactions} categories={categories} />
        <IncomeExpenseBar transactions={filteredPeriodTransactions} currentPeriod={currentPeriod} />
      </div>

      {/* Row 2: Advanced Analytics (Heatmap & MoM comparisons) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Spending Heatmap Calendar */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Weekly Spending Patterns</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily expense volume over the last 28 days.</p>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col justify-center gap-3 my-4">
            <div className="grid grid-cols-7 gap-2.5 max-w-md mx-auto w-full">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-[10px] text-center font-bold text-muted-foreground uppercase">{day}</div>
              ))}

              {heatmapData.map((week, wIdx) => (
                week.map((day, dIdx) => (
                  <div 
                    key={`${wIdx}-${dIdx}`}
                    className={`relative aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${getHeatmapColor(day.spent)}`}
                    title={`${day.formattedDate}: Spent ${formatCurrency(day.spent)}`}
                  >
                    {day.spent > 0 ? (
                      <span className="opacity-0 hover:opacity-100 absolute inset-0 bg-background/90 text-foreground rounded-lg flex items-center justify-center text-[8px] font-bold border border-border">
                        ₹{(day.spent >= 1000 ? `${(day.spent / 1000).toFixed(0)}k` : day.spent.toFixed(0))}
                      </span>
                    ) : null}
                  </div>
                ))
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-muted/40 border border-border/20 rounded"></div>
                <span>No expense</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/10 rounded"></div>
                <span>&lt; ₹1k</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-emerald-500/50 border border-emerald-500/20 rounded"></div>
                <span>₹1k - ₹5k</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-emerald-700 border border-emerald-800 rounded"></div>
                <span>&gt; ₹5k</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Month Cash Flow comparisons */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">6-Month Cash Flow Comparison</h3>
            <p className="text-xs text-muted-foreground mt-0.5">MoM side-by-side comparison of inflows vs outflows.</p>
          </div>

          <div className="flex-1 h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={momCashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  stroke="currentColor" 
                  className="text-[10px] text-muted-foreground" 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="currentColor" 
                  className="text-[10px] text-muted-foreground" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={val => val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                />
                <RechartsTooltip 
                  formatter={val => formatCurrency(val as number)}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced AI Ledger Overview Card */}
      <div className="bg-[#121c17] text-white border border-[#234233]/40 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[140px] group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300"></div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">AI Account Diagnostic</h3>
        </div>

        <p className="text-xs text-slate-200/95 leading-relaxed max-w-2xl">
          {selectedAccountId === 'all' 
            ? `Your aggregate analysis spans all accounts. Your overall savings rate stands at a healthy ${metrics.savingsRate.toFixed(0)}%. To further optimize, review individual bank channels separately.`
            : `Evaluating ledger trends for this channel: Total flow for this period is ${formatCurrency(metrics.income)} (inflow) vs ${formatCurrency(metrics.expense)} (outflow). Maintain strict category budgets to improve yields.`
          }
        </p>
      </div>
    </PageContainer>
  );
}
