
export const inr = (n: number, decimals = 0): string =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const compactINR = (n: number): string =>
  '₹' + Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export const fmtDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const fmtTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export const fmtDateTime = (ts: number): string => fmtDate(ts) + ' · ' + fmtTime(ts);

export const dayLabel = (iso: string): string =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export const startOfToday = (): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const PAY_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  credit: 'Store Credit',
};
