import { useMemo, useState } from 'react';
import { formatCurrency } from '../../lib/utils';
import type { Database } from '../../lib/types';
import { TrendingUp, TrendingDown, PiggyBank, Eye, EyeOff, Info } from 'lucide-react';
import { useAssetsLiabilities } from '../../lib/hooks/useAssetsLiabilities';

type Account = Database['public']['Tables']['accounts']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

type FinancialOverviewHeaderProps = {
  accounts: Account[];
  allTransactions: Transaction[];
  periodTransactions: Transaction[];
};

export default function FinancialOverviewHeader({
  accounts,
  allTransactions,
  periodTransactions,
}: FinancialOverviewHeaderProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const { items: assetsLiabilities } = useAssetsLiabilities();

  // 1. Calculate Total Net Worth (Total Balance + Assets - Liabilities)
  const liquidBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      let balance = acc.initial_balance;
      const accTxs = allTransactions.filter(t => t.account_id === acc.id);
      accTxs.forEach((t) => {
        if (t.type === 'income') balance += t.amount;
        if (t.type === 'expense') balance -= t.amount;
        if (t.type === 'transfer') {
          if (t.notes === 'outgoing') balance -= t.amount;
          else if (t.notes === 'incoming') balance += t.amount;
        }
      });
      return sum + balance;
    }, 0);
  }, [accounts, allTransactions]);

  const totalAssets = useMemo(() => {
    return assetsLiabilities.filter(i => i.type === 'asset').reduce((sum, item) => sum + item.value, 0);
  }, [assetsLiabilities]);

  const totalLiabilities = useMemo(() => {
    return assetsLiabilities.filter(i => i.type === 'liability').reduce((sum, item) => sum + item.value, 0);
  }, [assetsLiabilities]);

  const totalNetWorth = liquidBalance + totalAssets - totalLiabilities;

  // 2. Calculate Period Income, Expense, and Savings
  const { periodIncome, periodExpense, periodSavings, savingsRate } = useMemo(() => {
    let income = 0;
    let expense = 0;

    periodTransactions.forEach((t) => {
      if (t.type === 'transfer') return; // Exclude transfers
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });

    const savings = income - expense;
    const rate = income > 0 ? (savings / income) * 100 : 0;

    return {
      periodIncome: income,
      periodExpense: expense,
      periodSavings: savings,
      savingsRate: rate,
    };
  }, [periodTransactions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Large Total Balance Card (mockup style) */}
      <div className="lg:col-span-1 bg-[#12221a] dark:bg-[#0c1611] text-white border border-[#234233]/40 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider">Total Net Worth</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-emerald-400/80 hover:text-emerald-300 transition-colors p-1"
            >
              {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="relative">
            <button 
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-full flex items-center gap-1 cursor-pointer"
            >
              Breakdown <Info className="h-3 w-3" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-6 w-56 bg-card border border-border shadow-xl rounded-xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-foreground">
                    <span className="font-medium">Liquid Cash</span>
                    <span className="font-bold">{showBalance ? formatCurrency(liquidBalance) : '••••'}</span>
                  </div>
                  <div className="flex justify-between text-emerald-500">
                    <span className="font-medium">Fixed Assets</span>
                    <span className="font-bold">+{showBalance ? formatCurrency(totalAssets) : '••••'}</span>
                  </div>
                  <div className="flex justify-between text-red-500 pb-2 border-b border-border">
                    <span className="font-medium">Liabilities</span>
                    <span className="font-bold">-{showBalance ? formatCurrency(totalLiabilities) : '••••'}</span>
                  </div>
                  <div className="flex justify-between text-foreground font-bold">
                    <span>Net Worth</span>
                    <span>{showBalance ? formatCurrency(totalNetWorth) : '••••'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="my-4">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {showBalance ? formatCurrency(totalNetWorth) : '••••••'}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400/70">
          <span className="font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">+5.2%</span>
          <span>vs last month</span>
        </div>
      </div>

      {/* 2. Three Columns for Income, Expenses, Savings */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Income</span>
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(periodIncome)}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">+7.1%</span>
            <span>vs last month</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Expenses</span>
            <div className="bg-red-500/10 p-2 rounded-xl text-red-600 dark:text-red-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(periodExpense)}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-md">+3.6%</span>
            <span>vs last month</span>
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Savings</span>
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(periodSavings)}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">+{savingsRate.toFixed(0)}%</span>
            <span>savings rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
