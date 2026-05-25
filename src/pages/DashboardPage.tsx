import PageContainer from '../components/layout/PageContainer';
import { usePeriod } from '../lib/hooks/usePeriod';
import { usePreferences } from '../lib/hooks/usePreferences';
import { useAccounts } from '../lib/hooks/useAccounts';
import { useTransactions } from '../lib/hooks/useTransactions';
import { useCategories } from '../lib/hooks/useCategories';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import AccountCards from '../components/dashboard/AccountCards';
import FinancialOverviewHeader from '../components/dashboard/FinancialOverviewHeader';
import SpendingDonut from '../components/dashboard/SpendingDonut';
import IncomeExpenseBar from '../components/dashboard/IncomeExpenseBar';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import InsightsCard from '../components/dashboard/InsightsCard';
import BudgetProgressWidget from '../components/dashboard/BudgetProgressWidget';

export default function DashboardPage() {
  const { preferences } = usePreferences();
  const startDay = preferences?.financial_month_start_day || 18;
  
  const { periodType, setPeriodType, currentPeriod, nextPeriod, prevPeriod } = usePeriod(startDay);
  
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  
  // We fetch all transactions for account balances, 
  // and pass the period filtered transactions to the summary and charts.
  // In a very large app, we might do this differently, but for desktop it's fine.
  const { transactions } = useTransactions();
  
  const periodTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= currentPeriod.start && d <= currentPeriod.end;
  });

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground text-sm">Welcome to your financial dashboard!</p>
        </div>
      </div>

      <PeriodSelector 
        periodType={periodType}
        setPeriodType={setPeriodType}
        currentPeriod={currentPeriod}
        nextPeriod={nextPeriod}
        prevPeriod={prevPeriod}
      />

      <FinancialOverviewHeader 
        accounts={accounts}
        allTransactions={transactions}
        periodTransactions={periodTransactions}
      />

      <div className="mb-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">My Vault Accounts</p>
        <AccountCards accounts={accounts} transactions={transactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SpendingDonut transactions={periodTransactions} categories={categories} />
        <BudgetProgressWidget transactions={periodTransactions} categories={categories} />
      </div>

      <div className="mb-6">
        <IncomeExpenseBar transactions={periodTransactions} currentPeriod={currentPeriod} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={transactions} categories={categories} accounts={accounts} />
        <InsightsCard transactions={periodTransactions} categories={categories} />
      </div>
      
    </PageContainer>
  );
}
