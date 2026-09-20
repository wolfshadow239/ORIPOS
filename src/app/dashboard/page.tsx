'use client';

import Shell from '@/components/Shell';
import { useApp } from '@/components/Providers';
import { useData } from '@/components/hooks';
import { Card, CardTitle, Stat, Badge, Btn, Loading, Empty, Td, Th } from '@/components/ui';
import { TrendChart, HBars, Spark } from '@/components/charts';
import { dailySeries, rangeStats, storePerformance, topProducts } from '@/lib/analytics';
import { lowStockList, buildInsights } from '@/lib/ai';
import { inr, compactINR, fmtTime, startOfToday, PAY_LABEL } from '@/lib/format';
import { CircleDollarSign, ReceiptText, Boxes, Percent, AlertTriangle, Sparkles, ArrowRight, Crown } from 'lucide-react';
import Link from 'next/link';

const KIND_STYLE: Record<string, { dot: string; bg: string }> = {
  positive: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
  info: { dot: 'bg-brand', bg: 'bg-brand-light border-blue-200' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200' },
  critical: { dot: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200' },
};

function DashboardInner() {
  const { storeId, store, user } = useApp();
  const data = useData();
  if (!data) return <Loading />;
  if (!user) return null;

  const now = Date.now();
  const t0 = startOfToday();
  const today = rangeStats(data.orders, data.products, t0, now, storeId);
  const yest = rangeStats(data.orders, data.products, t0 - 86400000, t0, storeId);
  const growth = yest.revenue > 0 ? ((today.revenue - yest.revenue) / yest.revenue) * 100 : 0;
  const series = dailySeries(data.orders, 14, storeId);
  const perf = storePerformance(data.orders, now - 7 * 86400000, now);
  const topToday = topProducts(data.orders, data.products, t0, storeId, 5);
  const low = lowStockList(data.products, data.stock, storeId, data.orders, data.settings);
  const insights = buildInsights(data.orders, data.products, data.stock, storeId, data.settings).slice(0, 5);
  const recent = data.orders
    .filter(o => o.storeId === storeId && o.status !== 'held')
    .slice(-8)
    .reverse();

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat
          label="Revenue today"
          value={inr(today.revenue)}
          delta={`${Math.abs(growth).toFixed(1)}% vs yesterday`}
          down={growth < 0}
          icon={<CircleDollarSign size={20} />}
        />
        <Stat label="Orders today" value={String(today.orders)} hint={`AOV ${inr(today.aov)}`} icon={<ReceiptText size={20} />} />
        <Stat label="Units sold" value={String(today.units)} hint={`GST collected ${inr(today.tax)}`} icon={<Boxes size={20} />} />
        <Stat
          label="Gross margin"
          value={today.margin.toFixed(1) + '%'}
          delta={today.profit > 0 ? `${inr(today.profit)} profit` : undefined}
          down={today.margin < 18}
          icon={<Percent size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <Card className="xl:col-span-2">
          <CardTitle
            right={
              <Link href="/analytics" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                Full analytics <ArrowRight size={12} />
              </Link>
            }
          >
            Revenue · last 14 days — {store.short}
          </CardTitle>
          <TrendChart data={series} />
        </Card>

        {/* AI insights */}
        <Card>
          <CardTitle
            right={<Sparkles size={16} className="text-brand" />}
          >
            AI insights
          </CardTitle>
          <div className="space-y-3">
            {insights.map(i => (
              <div key={i.id} className={`rounded-xl border p-3 ${KIND_STYLE[i.kind].bg}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${KIND_STYLE[i.kind].dot}`} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-800 leading-snug">{i.title}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{i.body}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Store leaderboard */}
        <Card>
          <CardTitle>Store leaderboard · 7 days</CardTitle>
          <HBars
            data={perf.map(p => ({ name: p.storeId.toUpperCase(), revenue: p.revenue }))}
            yKey="name"
            xKey="revenue"
            height={272}
          />
          {user.role === 'admin' && (
            <p className="text-[11px] text-slate-400 mt-2">Scoped data shown for {store.short} — switch stores from the top bar.</p>
          )}
        </Card>

        {/* Top products today */}
        <Card>
          <CardTitle right={<Crown size={16} className="text-amber-500" />}>Top sellers today</CardTitle>
          {topToday.length === 0 ? (
            <Empty title="No sales yet today" body="Sales will appear here as they happen." />
          ) : (
            <div className="space-y-3">
              {topToday.map((t, i) => (
                <div key={t.productId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <span className="text-xl">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{t.name}</div>
                    <div className="text-[11px] text-slate-400">{t.units} units</div>
                  </div>
                  <span className="text-sm font-semibold text-ink">{compactINR(t.revenue)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Spark data={series} />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{series[0]?.label}</span>
              <span>Daily revenue momentum</span>
              <span>{series[series.length - 1]?.label}</span>
            </div>
          </div>
        </Card>

        {/* Low stock + recent */}
        <div className="space-y-6">
          <Card>
            <CardTitle
              right={
                <Link href="/inventory" className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                  Manage <ArrowRight size={12} />
                </Link>
              }
            >
              <span className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" /> Stock alerts · {store.short}
              </span>
            </CardTitle>
            {low.length === 0 ? (
              <Empty title="Inventory healthy" body="No SKU is below its reorder cover." />
            ) : (
              <div className="space-y-2.5">
                {low.slice(0, 5).map(l => (
                  <div key={l.product.id} className="flex items-center gap-3">
                    <span className="text-lg">{l.product.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{l.product.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {l.stock} in stock · sell {l.velocity}/day · ~{l.daysLeft === 999 ? '∞' : l.daysLeft}d left
                      </div>
                    </div>
                    <Badge color={l.stock === 0 ? 'rose' : 'amber'}>{l.stock === 0 ? 'OUT' : 'LOW'}</Badge>
                  </div>
                ))}
                {low.length > 5 && <div className="text-xs text-slate-400 text-center">+{low.length - 5} more in inventory</div>}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent orders */}
      <Card pad={false}>
        <CardTitle>
          <span className="px-5 pt-5 block">Recent orders · {store.short}</span>
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Order</Th><Th>Time</Th><Th>Items</Th><Th>Payment</Th><Th>Customer</Th><Th>Cashier</Th><Th className="text-right">Total</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-brand">{o.id}</Td>
                  <Td className="text-slate-500">{fmtTime(o.createdAt)}</Td>
                  <Td>{o.items.reduce((s, i) => s + i.qty, 0)}</Td>
                  <Td>{o.payments.map(p => PAY_LABEL[p.method]).join(' + ')}</Td>
                  <Td className="text-slate-500">
                    {o.customerId ? data.customers.find(c => c.id === o.customerId)?.name || '—' : 'Walk-in'}
                  </Td>
                  <Td className="text-slate-500">{o.cashier}</Td>
                  <Td className="text-right font-semibold text-ink">{inr(o.total)}</Td>
                  <Td><Badge color={o.status === 'refunded' ? 'rose' : 'green'}>{o.status}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Shell title="Dashboard" subtitle="Live overview of store performance, AI signals and stock health.">
      <DashboardInner />
    </Shell>
  );
}
