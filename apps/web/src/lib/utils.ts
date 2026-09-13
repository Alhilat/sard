import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatArabicRelativeTime(
  dateInput: number | string | Date | undefined | null,
  fallbackText?: string
): string {
  if (!dateInput) return fallbackText || 'منذ قليل';

  // If already a pre-formatted Arabic relative string that is not "الآن"
  if (typeof dateInput === 'string' && dateInput !== 'الآن' && dateInput.startsWith('منذ')) {
    return dateInput;
  }

  let timeMs: number;
  if (typeof dateInput === 'number') {
    timeMs = dateInput < 1e11 ? dateInput * 1000 : dateInput;
  } else if (dateInput instanceof Date) {
    timeMs = dateInput.getTime();
  } else if (!isNaN(Number(dateInput)) && Number(dateInput) > 0) {
    const num = Number(dateInput);
    timeMs = num < 1e11 ? num * 1000 : num;
  } else {
    timeMs = new Date(dateInput).getTime();
  }

  if (isNaN(timeMs) || timeMs <= 0) {
    return fallbackText || (typeof dateInput === 'string' ? dateInput : 'منذ قليل');
  }

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timeMs) / 1000));

  if (diffSec < 45) {
    return 'الآن';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'منذ دقيقة';
  if (diffMin === 2) return 'منذ دقيقتين';
  if (diffMin >= 3 && diffMin <= 10) return `منذ ${diffMin} دقائق`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'منذ ساعة';
  if (diffHours === 2) return 'منذ ساعتين';
  if (diffHours >= 3 && diffHours <= 10) return `منذ ${diffHours} ساعات`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'أمس';
  if (diffDays === 2) return 'منذ يومين';
  if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${diffDays} يوماً`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'منذ شهر';
  if (diffMonths === 2) return 'منذ شهرين';
  if (diffMonths < 12) return `منذ ${diffMonths} أشهر`;

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return 'منذ سنة';
  if (diffYears === 2) return 'منذ سنتين';
  return `منذ ${diffYears} سنوات`;
}
