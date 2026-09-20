
import { Order, Product } from './types';
import { Settings } from './db';
import { rangeStats, dailySeries, topProducts, forecast, soldQty, storePerformance } from './analytics';
import { round2 } from './compute';
import { compactINR } from './format';

const DAY = 86400000;

export interface Insight {
  id: string;
  kind: 'positive' | 'warning' | 'critical' | 'info';
  tag: string;
  title: string;
  body: string;
}

export interface RestockRow {
  product: Product;
  stock: number;
  sold30: number;
  velocity: number;
  daysLeft: number;
  suggest: number;
  orderValue: number;
}

export function restockPlan(
  orders: Order[],
  products: Product[],
  stock: Record<string, Record<string, number>>,
  storeId: string,
  days: number,
): RestockRow[] {
  const since = Date.now() - days * DAY;
  const rows: RestockRow[] = [];
  for (const p of products) {
    const s = stock[storeId]?.[p.id] ?? 0;
    const sold = soldQty(orders, storeId, p.id, since);
    if (sold === 0) continue;
    const velocity = sold / days;
    const daysLeft = velocity > 0 ? s / velocity : Infinity;
    if (daysLeft < 21) {
      const suggest = Math.max(0, Math.ceil(velocity * 30 - s));
      rows.push({
        product: p,
        stock: s,
        sold30: sold,
        velocity: round2(velocity),
        daysLeft: daysLeft === Infinity ? 999 : Math.round(daysLeft),
        suggest,
        orderValue: suggest * p.cost,
      });
    }
  }
  return rows.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function lowStockList(
  products: Product[],
  stock: Record<string, Record<string, number>>,
  storeId: string,
  orders: Order[],
  settings: Settings,
): RestockRow[] {
  return restockPlan(orders, products, stock, storeId, 30).filter(r => r.daysLeft <= settings.lowStockDays || r.stock === 0);
}

export function coBuySuggestions(
  pairs: Record<string, [string, number][]>,
  cartProductIds: string[],
  products: Product[],
  exclude: string[],
): Product[] {
  const last = cartProductIds[cartProductIds.length - 1];
  if (!last || !pairs[last]) return [];
  const out: Product[] = [];
  for (const [pid] of pairs[last]) {
    if (exclude.includes(pid)) continue;
    const p = products.find(x => x.id === pid);
    if (p) out.push(p);
    if (out.length >= 3) break;
  }
  return out;
}

export function buildInsights(
  orders: Order[],
  products: Product[],
  stock: Record<string, Record<string, number>>,
  storeId: string | null,
  settings: Settings,
): Insight[] {
  const now = Date.now();
  const insights: Insight[] = [];
  const push = (kind: Insight['kind'], tag: string, title: string, body: string) =>
    insights.push({ id: Math.random().toString(36).slice(2), kind, tag, title, body });

  const last7 = rangeStats(orders, products, now - 7 * DAY, now, storeId);
  const prev7 = rangeStats(orders, products, now - 14 * DAY, now - 7 * DAY, storeId);
  if (prev7.revenue > 0) {
    const growth = ((last7.revenue - prev7.revenue) / prev7.revenue) * 100;
    push(
      growth >= 0 ? 'positive' : 'warning',
      'Trend',
      `${growth >= 0 ? '▲' : '▼'} Revenue ${growth >= 0 ? 'up' : 'down'} ${Math.abs(growth).toFixed(1)}% week-on-week`,
      `Last 7 days: ${compactINR(last7.revenue)} across ${last7.orders} orders vs ${compactINR(prev7.revenue)} the week before. AOV ${compactINR(last7.aov)}.`,
    );
  }

  const series = dailySeries(orders, 60, storeId);
  const fc = forecast(series, 7);
  if (fc.length) {
    const next7 = fc.reduce((s, f) => s + f.forecast, 0);
    push(
      'info',
      'Forecast',
      `Next 7 days projected at ${compactINR(round2(next7))}`,
      `Trend + weekday seasonality model. 80% confidence band: ${compactINR(fc[0].lo)} – ${compactINR(fc[fc.length - 1].hi)} on ${fc[fc.length - 1].label}.`,
    );
  }

  if (!storeId) {
    const perf = storePerformance(orders, now - 30 * DAY, now);
    if (perf.length >= 2) {
      const best = perf[0];
      const worst = perf[perf.length - 1];
      push(
        'info',
        'Stores',
        `${best.storeId.toUpperCase()} leads, ${worst.storeId.toUpperCase()} trails`,
        `${best.storeId} did ${compactINR(best.revenue)} (30d, ${best.share}% share) vs ${compactINR(worst.revenue)} at ${worst.storeId}. Consider staff swaps or local marketing for the laggard.`,
      );
    }
  } else {
    const low = lowStockList(products, stock, storeId, orders, settings);
    if (low.length) {
      push(
        'critical',
        'Inventory',
        `${low.length} SKU${low.length > 1 ? 's' : ''} below ${settings.lowStockDays}-day cover at ${storeId.toUpperCase()}`,
        `Urgent: ${low.slice(0, 3).map(l => l.product.name).join(', ')}${low.length > 3 ? ' +' + (low.length - 3) + ' more' : ''}. Suggested restock value ${compactINR(low.reduce((s, l) => s + l.orderValue, 0))}.`,
      );
    }
  }

  const top = topProducts(orders, products, now - 30 * DAY, storeId, 1);
  if (top.length) {
    push('positive', 'Hero SKU', `${top[0].name} is the #1 revenue driver`, `${top[0].units} units in 30 days generating ${compactINR(top[0].revenue)}. Keep demo units charged and accessories attached.`);
  }

  const recent = series.filter(s => s.orders > 0);
  if (recent.length > 10) {
    const mean = recent.reduce((s, x) => s + x.total, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((s, x) => s + Math.pow(x.total - mean, 2), 0) / recent.length);
    const spikes = recent.filter(x => std > 0 && Math.abs(x.total - mean) > 2.2 * std).slice(-3);
    if (spikes.length) {
      push(
        'warning',
        'Anomaly',
        `Unusual ${spikes[spikes.length - 1].total > mean ? 'spike' : 'dip'} detected on ${spikes[spikes.length - 1].label}`,
        `Daily revenue of ${compactINR(spikes[spikes.length - 1].total)} vs ${compactINR(mean)} average (±2.2σ). ${spikes[spikes.length - 1].total > mean ? 'Check for a bulk/festive sale to replicate.' : 'Investigate stockouts, staff absence or local events.'}`,
      );
    }
  }

  const upiShare = (() => {
    let upi = 0, all = 0;
    for (const o of orders) {
      if (o.status !== 'completed' || o.createdAt < now - 30 * DAY) continue;
      if (storeId && o.storeId !== storeId) continue;
      for (const p of o.payments) {
        all += p.amount;
        if (p.method === 'upi') upi += p.amount;
      }
    }
    return all > 0 ? (upi / all) * 100 : 0;
  })();
  if (upiShare > 0) {
    push('info', 'Payments', `UPI accounts for ${upiShare.toFixed(0)}% of takings`, 'Digital share this high means faster checkout — keep QR stands visible at both counters and reconcile UPI settlements daily.');
  }

  if (storeId) {
    const plan = restockPlan(orders, products, stock, storeId, 30);
    const slow = plan.filter(r => r.velocity < 0.15 && r.stock > 12);
    if (slow.length) {
      push('warning', 'Slow movers', `${slow.length} slow-moving SKU${slow.length > 1 ? 's' : ''} tying up working capital`, `${slow.slice(0, 3).map(s => s.product.name).join(', ')} — consider bundling with hero SKUs or inter-store transfer.`);
    }
  }

  return insights;
}
