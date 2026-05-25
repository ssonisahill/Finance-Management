import { useMemo, useState } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Sparkles, X, Brain } from 'lucide-react';
import type { Database } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { useSubscriptions } from '../../lib/hooks/useSubscriptions';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type InsightsCardProps = {
  transactions: Transaction[];
  categories: Category[];
};

export default function InsightsCard({ transactions, categories }: InsightsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { subscriptions } = useSubscriptions();

  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions.filter(sub => {
      const dueDay = sub.due_day;
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Project due date in this active calendar month
      let dueDate = new Date(currentYear, currentMonth, dueDay);
      
      // Clamp due day if it exceeds the maximum days in this month
      const maxDaysThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      if (dueDay > maxDaysThisMonth) {
        dueDate = new Date(currentYear, currentMonth, maxDaysThisMonth);
      }

      // If the due date has already passed in the current month, project it to next month
      if (dueDate < today) {
        let nextMonth = currentMonth + 1;
        let nextYear = currentYear;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear += 1;
        }
        
        dueDate = new Date(nextYear, nextMonth, dueDay);
        const maxDaysNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
        if (dueDay > maxDaysNextMonth) {
          dueDate = new Date(nextYear, nextMonth, maxDaysNextMonth);
        }
      }

      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 0 && diffDays <= 7;
    });
  }, [subscriptions]);

  const { insights, primaryInsight } = useMemo(() => {
    const generated: { title: string; desc: string; type: 'positive' | 'negative' | 'neutral' | 'alert'; action: string }[] = [];
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    // 1. Subscription Alerts (Highly Actionable!)
    if (upcomingBills.length > 0) {
      const totalUpcoming = upcomingBills.reduce((sum, s) => sum + s.amount, 0);
      generated.push({
        title: 'Upcoming Automated Deductions',
        desc: `You have ${upcomingBills.length} subscription(s) due in the next 7 days totaling ${formatCurrency(totalUpcoming)}.`,
        type: 'alert',
        action: 'Ensure your debit accounts have adequate liquid balances to cover these automated deductions.'
      });
    }

    // 2. Savings Rate Insight
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
      if (savingsRate > 20) {
        generated.push({
          title: 'Great Savings Rate!',
          desc: `You are saving ${savingsRate.toFixed(1)}% of your income this period. Keep it up!`,
          type: 'positive',
          action: 'Allocate 10% of this surplus into long-term investments to let compound interest work.'
        });
      } else if (savingsRate < 0) {
        generated.push({
          title: 'Negative Cash Flow Alert',
          desc: `You have spent more than you earned this period by ${formatCurrency(totalExpense - totalIncome)}.`,
          type: 'alert',
          action: 'Postpone non-essential purchases and review categories with high spending immediately.'
        });
      }
    }

    // 3. Top Category Insight
    if (expenses.length > 0) {
      const categoryTotals: Record<string, number> = {};
      expenses.forEach(t => {
        const catId = t.category_id || 'uncategorized';
        categoryTotals[catId] = (categoryTotals[catId] || 0) + t.amount;
      });

      const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
      if (topCategory && topCategory[1] > 0) {
        const cat = categories.find(c => c.id === topCategory[0]);
        const catName = cat ? cat.name : 'Uncategorized';
        const percent = ((topCategory[1] / totalExpense) * 100).toFixed(0);
        
        generated.push({
          title: 'Highest Spending Area',
          desc: `${catName} accounts for ${percent}% of your total expenses (${formatCurrency(topCategory[1])}).`,
          type: 'neutral',
          action: `Consider setting a Category Budget in Settings for ${catName} to save up to 15% next week.`
        });
      }
    }

    // 4. Large Transaction Alert
    const largeTransactions = expenses.filter(t => t.amount > 5000);
    if (largeTransactions.length > 0) {
      generated.push({
        title: 'Large Expenses Detected',
        desc: `You had ${largeTransactions.length} transaction(s) that were unusually large (> ₹5,000).`,
        type: 'alert',
        action: 'Review these transactions to ensure they are correct and to plan for next cycle.'
      });
    }

    if (generated.length === 0) {
      generated.push({
        title: 'Financial Pulse Healthy',
        desc: 'Your spending looks completely normal for this period. No major anomalies detected.',
        type: 'positive',
        action: 'This is the perfect time to build your emergency savings buffer!'
      });
    }

    // Determine the most urgent/relevant primary insight to display in the main widget
    const alertInsight = generated.find(i => i.type === 'alert');
    const neutralInsight = generated.find(i => i.type === 'neutral');
    const primary = alertInsight || neutralInsight || generated[0];

    return { insights: generated, primaryInsight: primary };
  }, [transactions, categories, upcomingBills]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'negative': return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default: return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <>
      {/* AI Smart Insight Main Card (matching dark card mockup) */}
      <div className="bg-[#121c17] text-white border border-[#234233]/40 rounded-3xl p-6 shadow-md flex flex-col justify-between h-full min-h-[220px] relative overflow-hidden group">
        {/* Glow decoration */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300"></div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">AI Smart Insight</h3>
          </div>

          <div className="my-2">
            <h4 className="text-base font-bold text-slate-100">{primaryInsight.title}</h4>
            <p className="text-xs text-slate-300/90 mt-2 leading-relaxed">
              {primaryInsight.desc}
            </p>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            View Suggestions
          </button>
        </div>
      </div>

      {/* Suggestions Modal (gorgeous overlay list) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">AI Intelligence & Suggestions</h3>
                  <p className="text-[10px] text-muted-foreground">Comprehensive Vault Diagnosis</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex gap-4 p-4 border border-border/80 rounded-2xl bg-muted/30">
                  <div className="mt-0.5 shrink-0 bg-background p-2 rounded-xl border border-border/50 shadow-xs">
                    {getIcon(insight.type)}
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-xs text-foreground">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
                    <div className="mt-2 text-xs font-medium text-primary bg-primary/5 p-2 rounded-lg border border-primary/10 leading-relaxed">
                      💡 <strong>Recommendation:</strong> {insight.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-muted/10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
