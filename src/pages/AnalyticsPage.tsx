import PageContainer from '../components/layout/PageContainer';
import { useTransactions } from '../lib/hooks/useTransactions';
import { useCategories } from '../lib/hooks/useCategories';
import SpendingDonut from '../components/dashboard/SpendingDonut';
import IncomeExpenseBar from '../components/dashboard/IncomeExpenseBar';
import { usePeriod } from '../lib/hooks/usePeriod';
import { usePreferences } from '../lib/hooks/usePreferences';
import PeriodSelector from '../components/dashboard/PeriodSelector';

export default function AnalyticsPage() {
  const { preferences } = usePreferences();
  const startDay = preferences?.financial_month_start_day || 18;
  const { periodType, setPeriodType, currentPeriod, nextPeriod, prevPeriod } = usePeriod(startDay);

  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const periodTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= currentPeriod.start && d <= currentPeriod.end;
  });

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Deep dive into your spending and savings trends.</p>
      </div>

      <PeriodSelector 
        periodType={periodType}
        setPeriodType={setPeriodType}
        currentPeriod={currentPeriod}
        nextPeriod={nextPeriod}
        prevPeriod={prevPeriod}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SpendingDonut transactions={periodTransactions} categories={categories} />
        <IncomeExpenseBar transactions={periodTransactions} currentPeriod={currentPeriod} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-bold text-foreground mb-2">More Advanced Reports</h3>
        <p className="text-muted-foreground text-sm">Advanced line charts, year-over-year comparisons, and category specific drill-downs will appear here.</p>
      </div>
    </PageContainer>
  );
}
