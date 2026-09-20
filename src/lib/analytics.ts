
import { Order, Product } from './types';
import { round2 } from './compute';

const DAY = 86400000;

export interface DayPoint {
  date: string;
  label: string;
  total: number;
  orders: number;
  units: number;
}

function isoDay(ts: number): string {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function dailySeries(orders: Order[], days: number, storeId?: string | null): DayPoint[] {
  const map = new Map<string, DayPoint>();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY);
    const iso = isoDay(d.getTime());
    map.set(iso, {
      date: iso,
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      total: 0,
      orders: 0,
      units: 0,
    });
  }
  for (const o of orders) {
    if (o.status !== 'completed') continue;
    if (storeId && o.storeId !== storeId) continue;
    const k = isoDay(o.createdAt);
    const p = map.get(k);
    if (!p) continue;
    p.total += o.total;
    p.orders += 1;
    p.units += o.items.reduce((s, i) => s + i.qty, 0);
  }
  for (const p of map.values()) p.total = round2(p.total);
  return [...map.values()];
}

export interface RangeStats {
  revenue: number;
  orders: number;
  units: number;
  tax: number;
  profit: number;
  aov: number;
  margin: number;
  discounts: number;
}

export function rangeStats(
  orders: Order[],
  products: Product[],
  from: number,
  to: number,
  storeId?: string | null,
): RangeStats {
  const cost = new Map(products.map(p => [p.id, p.cost]));
  let revenue = 0, count = 0, units = 0, tax = 0, profit = 0, discounts = 0;
  for (const o of orders) {
    if (o.status !== 'completed') continue;
    if (o.createdAt < from || o.createdAt >= to) continue;
    if (storeId && o.storeId !== storeId) continue;
    revenue += o.total;
    tax += o.tax;
    discounts += o.discount + o.items.reduce((s, i) => s + (i.discount || 0) * i.qty, 0);
    count += 1;
    let gross = 0;
    for (const i of o.items) {
      units += i.qty;
      const c = cost.get(i.productId) ?? i.price * 0.75;
      gross += (i.price - (i.discount || 0) - c) * i.qty;
    }
    const ratio = o.subtotal > 0 ? (o.subtotal - o.discount) / o.subtotal : 1;
    profit += gross * ratio;
  }
  return {
    revenue: round2(revenue),
    orders: count,
    units,
    tax: round2(tax),
    profit: round2(profit),
    aov: count > 0 ? round2(revenue / count) : 0,
    margin: revenue > 0 ? round2((profit / revenue) * 100) : 0,
    discounts: round2(discounts),
  };
}

export interface StorePerf {
  storeId: string;
  revenue: number;
  orders: number;
  aov: number;
  units: number;
  share: number;
}

export function storePerformance(orders: Order[], from: number, to: number): StorePerf[] {
  const agg = new Map<string, StorePerf>();
  let total = 0;
  for (const o of orders) {
    if (o.status !== 'completed' || o.createdAt < from || o.createdAt >= to) continue;
    const a = agg.get(o.storeId) || { storeId: o.storeId, revenue: 0, orders: 0, aov: 0, units: 0, share: 0 };
    a.revenue += o.total;
    a.orders += 1;
    a.units += o.items.reduce((s, i) => s + i.qty, 0);
    total += o.total;
    agg.set(o.storeId, a);
  }
  const out = [...agg.values()].sort((a, b) => b.revenue - a.revenue);
  for (const a of out) {
    a.revenue = round2(a.revenue);
    a.aov = a.orders > 0 ? round2(a.revenue / a.orders) : 0;
    a.share = total > 0 ? round2((a.revenue / total) * 100) : 0;
  }
  return out;
}

export function categoryBreakdown(orders: Order[], products: Product[], from: number, storeId?: string | null) {
  const cat = new Map(products.map(p => [p.id, p.category]));
  const agg = new Map<string, number>();
  for (const o of orders) {
    if (o.status !== 'completed' || o.createdAt < from) continue;
    if (storeId && o.storeId !== storeId) continue;
    for (const i of o.items) {
      const c = cat.get(i.productId) || 'Other';
      agg.set(c, (agg.get(c) || 0) + (i.price - (i.discount || 0)) * i.qty);
    }
  }
  return [...agg.entries()].map(([name, value]) => ({ name, value: round2(value) })).sort((a, b) => b.value - a.value);
}

export interface TopProduct {
  productId: string;
  name: string;
  emoji: string;
  units: number;
  revenue: number;
}

export function topProducts(orders: Order[], products: Product[], from: number, storeId: string | null, n: number): TopProduct[] {
  const info = new Map(products.map(p => [p.id, p]));
  const agg = new Map<string, TopProduct>();
  for (const o of orders) {
    if (o.status !== 'completed' || o.createdAt < from) continue;
    if (storeId && o.storeId !== storeId) continue;
    for (const i of o.items) {
      const p = info.get(i.productId);
      const a = agg.get(i.productId) || {
        productId: i.productId,
        name: i.name,
        emoji: p?.emoji || '🛍️',
        units: 0,
        revenue: 0,
      };
      a.units += i.qty;
      a.revenue += (i.price - (i.discount || 0)) * i.qty;
      agg.set(i.productId, a);
    }
  }
  return [...agg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, n).map(a => ({ ...a, revenue: round2(a.revenue) }));
}

export function paymentSplit(orders: Order[], from: number, storeId?: string | null) {
  const agg: Record<string, number> = { cash: 0, card: 0, upi: 0, credit: 0 };
  for (const o of orders) {
    if (o.status !== 'completed' || o.createdAt < from) continue;
    if (storeId && o.storeId !== storeId) continue;
    for (const p of o.payments) agg[p.method] = (agg[p.method] || 0) + p.amount;
  }
  return (Object.keys(agg) as (keyof typeof agg)[]).map(k => ({ name: k, value: round2(agg[k]) }));
}

export function heatmap(orders: Order[], from: number, storeId?: string | null): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(12).fill(0));
  for (const o of orders) {
    if (o.status !== 'completed' || o.createdAt < from) continue;
    if (storeId && o.storeId !== storeId) continue;
    const d = new Date(o.createdAt);
    grid[d.getDay()][d.getHours() - 10] += o.total;
  }
  return grid;
}

export interface ForecastPoint {
  date: string;
  label: string;
  forecast: number;
  lo: number;
  hi: number;
}

export function forecast(series: DayPoint[], horizon = 14): ForecastPoint[] {
  const y = series.slice(-60).map(s => s.total);
  const n = y.length;
  if (n < 7) return [];
  const xs = y.map((_, i) => i);
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = y.reduce((a, b) => a + b, 0);
  const sxy = xs.reduce((a, x, i) => a + x * y[i], 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const intercept = (sy - slope * sx) / n;

  const dowSum = new Array(7).fill(0);
  const dowCnt = new Array(7).fill(0);
  for (const s of series) {
    const d = new Date(s.date + 'T12:00:00').getDay();
    dowSum[d] += s.total;
    dowCnt[d]++;
  }
  const overall = sy / n;
  const dowFactor = dowSum.map((t, i) => (dowCnt[i] ? t / dowCnt[i] : overall) / (overall || 1));

  const residStd = Math.sqrt(
    y.reduce((a, v, i) => a + Math.pow(v - (intercept + slope * i), 2), 0) / n,
  );

  const last = new Date(series[series.length - 1].date + 'T12:00:00');
  const out: ForecastPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    const d = new Date(last.getTime() + h * DAY);
    const base = intercept + slope * (n - 1 + h);
    const val = Math.max(0, base * dowFactor[d.getDay()]);
    out.push({
      date: isoDay(d.getTime()),
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      forecast: round2(val),
      lo: round2(Math.max(0, val - 1.28 * residStd)),
      hi: round2(val + 1.28 * residStd),
    });
  }
  return out;
}

export interface ABCRow {
  productId: string;
  name: string;
  category: string;
  revenue: number;
  share: number;
  cumulative: number;
  cls: 'A' | 'B' | 'C';
}

export function abcAnalysis(orders: Order[], products: Product[], from: number): ABCRow[] {
  const info = new Map(products.map(p => [p.id, p]));
  const agg = new Map<string, number>();
  let total = 0;
  for (const o of orders) {
    if (o.status !== 'completed' || o.createdAt < from) continue;
    for (const i of o.items) {
      const v = (i.price - (i.discount || 0)) * i.qty;
      agg.set(i.productId, (agg.get(i.productId) || 0) + v);
      total += v;
    }
  }
  let cum = 0;
  return [...agg.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([pid, rev]) => {
      const share = total > 0 ? (rev / total) * 100 : 0;
      cum += share;
      const p = info.get(pid);
      return {
        productId: pid,
        name: p?.name || pid,
        category: p?.category || 'Other',
        revenue: round2(rev),
        share: round2(share),
        cumulative: round2(cum),
        cls: (cum <= 80 ? 'A' : cum <= 95 ? 'B' : 'C') as 'A' | 'B' | 'C',
      };
    });
}

export function soldQty(orders: Order[], storeId: string, productId: string, since: number): number {
  let q = 0;
  for (const o of orders) {
    if (o.status !== 'completed' || o.storeId !== storeId || o.createdAt < since) continue;
    for (const i of o.items) if (i.productId === productId) q += i.qty;
  }
  return q;
}
