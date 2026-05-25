import { useMemo, useState } from 'react';
import { formatCurrency } from '../../lib/utils';
import type { Database } from '../../lib/types';
import { TrendingUp, TrendingDown, PiggyBank, Eye, EyeOff } from 'lucide-react';

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

  // 1. Calculate Total Net Worth (Total Balance)
  const totalNetWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      let balance = acc.initial_balance;
      const accTxs = allTransactions.filter(t => t.account_id === acc.id);
      accTxs.forEach((t) => {
        if (t.type === 'income') balance += t.amount;
        if (t.type === 'expense') balance -= t.amount;
      });
      return sum + balance;
    }, 0);
  }, [accounts, allTransactions]);

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
            <span className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider">Total Balance</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-emerald-400/80 hover:text-emerald-300 transition-colors p-1"
            >
              {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-full">
            Local Vault
          </span>
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
