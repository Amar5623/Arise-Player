/** Number and money formatting. Money uses Indian digit grouping (1,00,000). */

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export function groupIN(n: number, decimals = false): string {
  return (decimals ? inr2 : inr).format(n);
}

export function money(amount: number, currency = '₹'): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency}${groupIN(Math.abs(amount))}`;
}

/** 90 -> "1:30", 45 -> "0:45". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Rest label: 90 -> "90 s", 0 -> "none". */
export function restLabel(seconds: number): string {
  return seconds > 0 ? `${seconds} s` : 'none';
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}
