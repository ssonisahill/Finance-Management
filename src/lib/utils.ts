import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '₹') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('₹', currency);
}

export function getFinancialPeriod(referenceDate: Date, startDay: number) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  if (day >= startDay) {
    // Current month's cycle
    return {
      start: new Date(year, month, startDay),
      end: new Date(year, month + 1, startDay - 1),
    };
  } else {
    // Previous month's cycle
    return {
      start: new Date(year, month - 1, startDay),
      end: new Date(year, month, startDay - 1),
    };
  }
}
