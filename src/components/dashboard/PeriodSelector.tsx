import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { PeriodType } from '../../lib/hooks/usePeriod';

type PeriodSelectorProps = {
  periodType: PeriodType;
  setPeriodType: (type: PeriodType) => void;
  currentPeriod: { start: Date; end: Date };
  nextPeriod: () => void;
  prevPeriod: () => void;
};

export default function PeriodSelector({
  periodType,
  setPeriodType,
  currentPeriod,
  nextPeriod,
  prevPeriod,
}: PeriodSelectorProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const periodLabel = `${formatDate(currentPeriod.start)} – ${formatDate(currentPeriod.end)}`;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-2">
        <button
          onClick={prevPeriod}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 font-medium text-foreground min-w-[200px] justify-center">
          <Calendar className="h-4 w-4 text-primary" />
          {periodLabel}
        </div>
        <button
          onClick={nextPeriod}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setPeriodType('custom_cycle')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            periodType === 'custom_cycle'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Custom Cycle
        </button>
        <button
          onClick={() => setPeriodType('this_month')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            periodType === 'this_month'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriodType('this_week')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            periodType === 'this_week'
              ? 'bg-primary text-primary-foreground font-medium'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          This Week
        </button>
      </div>
    </div>
  );
}
