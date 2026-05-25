import { useState, useMemo } from 'react';
import { getFinancialPeriod } from '../utils';
import { addMonths, subMonths } from 'date-fns';

export type PeriodType = 'custom_cycle' | 'this_month' | 'this_week' | 'custom_range';

export function usePeriod(startDay: number = 18) {
  const [periodType, setPeriodType] = useState<PeriodType>('custom_cycle');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | null>(null);

  const currentPeriod = useMemo(() => {
    if (periodType === 'custom_cycle') {
      return getFinancialPeriod(referenceDate, startDay);
    } else if (periodType === 'this_month') {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0), // last day of month
      };
    } else if (periodType === 'this_week') {
      const day = referenceDate.getDay();
      const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const start = new Date(referenceDate.setDate(diff));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (periodType === 'custom_range' && customRange) {
      return customRange;
    }
    
    // Fallback
    return getFinancialPeriod(new Date(), startDay);
  }, [periodType, referenceDate, startDay, customRange]);

  const nextPeriod = () => {
    if (periodType === 'custom_cycle' || periodType === 'this_month') {
      setReferenceDate((prev) => addMonths(prev, 1));
    }
    // Implement other next logics as needed
  };

  const prevPeriod = () => {
    if (periodType === 'custom_cycle' || periodType === 'this_month') {
      setReferenceDate((prev) => subMonths(prev, 1));
    }
    // Implement other prev logics as needed
  };

  return {
    periodType,
    setPeriodType,
    currentPeriod,
    nextPeriod,
    prevPeriod,
    referenceDate,
    setReferenceDate,
    setCustomRange,
  };
}
