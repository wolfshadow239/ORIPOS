
'use client';

import { useMemo, useState } from 'react';
import Shell from '@/components/Shell';
import { useApp } from '@/components/Providers';
import { useData } from '@/components/hooks';
import { Card, CardTitle, Stat, Badge, Btn, Select, Loading, Td, Th } from '@/components/ui';
import { TrendChart, DonutChart, HBars, ForecastChart } from '@/components/charts';
import {
  dailySeries, rangeStats, storePerformance, categoryBreakdown, topProducts,
  paymentSplit, heatmap, forecast, abcAnalysis,
} from '@/lib/analytics';
import { restockPlan, buildInsights } from '@/lib/ai';
import { inr, compactINR, PAY_LABEL } from '@/lib/format';
import { STORES } from '@/lib/stores';
import {
  CircleDollarSign, ReceiptText, Boxes, Percent, BrainCircuit, Download, Sparkles,
} from 'lucide-react';
import { downloadCSV } from '@/lib/export';

const HOUR_LABELS = ['10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'];
const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AnalyticsInner() {
  const { storeId } = useApp();
  const data = useData();
  const [scope, setScope] = useState<string>('all');
  const [range, setRange] = useState(30);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const effectiveScope = scope === 'all' ? null : scope;

  const calc = useMemo(() => {
    if (!data) return null;
    const now = Date.now();
    const from = now - range * 86400000;
    const series = dailySeries(data.orders, range, effectiveScope);
    const stats = rangeStats(data.orders, data.products, from, now, effectiveScope);
    const cats = categoryBreakdown(data.orders, data.products, from, effectiveScope);
    const perf = storePerformance(data.orders, from, now);
    const top = topProducts(data.orders, data.products, from, effectiveScope, 10);
    const pays = paymentSplit(data.orders, from, effectiveScope);
    const hm = heatmap(data.orders, from, effectiveScope);
    const fc = forecast(series, 14);
    const abc = abcAnalysis(data.orders, data.products, from).slice(0, 15);
    const plan = effectiveScope ? restockPlan(data.orders, data.products, data.stock, effectiveScope, 30).slice(0, 8) : [];
    const insights = buildInsights(data.orders, data.products, data.stock, effectiveScope, data.settings);
    return { series, stats, cats, perf, top, pays, hm, fc, abc, plan, insights, from };
  }, [data, range, effectiveScope]);

  if (!data || !calc) return <Loading />;

  const hmMax = Math.max(1, ...calc.hm.flat());
  const forecastNext7 = calc.fc.slice(0, 7).reduce((s, f) => s + f.forecast, 0);
  const last7Actual = calc.series.slice(-7).reduce((s, x) => s + x.total, 0);

  const runSummary = async () => {
    setLoadingAI(true);
    setSummary(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: {
            scope: scope, rangeDays: range, ...calc.stats,
            forecastNext7: Math.round(forecastNext7),
            topProduct: calc.top[0]?.name,
            lowStockCount: calc.plan.length,
          },
          insights: calc.insights,
        }),
      });
      const j = await res.json() as { summary?: string };
      setSummary(j.summary || 'No summary available.');
    } catch {
      setSummary(calc.insights.slice(0, 5).map(i => '• ' + i.title + ' — ' + i.body).join('\n\n'));
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={scope} onChange={e => setScope(e.target.value)}>
          <option value="all">All 9 stores</option>
          {STORES.map(s => <option key={s.id} value={s.id}>{s.name.replace('Orison Retail - ', '')}</option>)}
        </Select>
        <Select value={range} onChange={e => setRange(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={150}>Last 150 days</option>
        </Select>
        <div className="flex-1" />
        <Btn variant="soft" onClick={runSummary} disabled={loadingAI}>
          <BrainCircuit size={15} /> {loadingAI ? 'Thinking…' : 'AI executive summary'}
        </Btn>
        <Btn
          variant="outline"
          onClick={() =>
            downloadCSV(
              `orison-sales-${scope}-${range}d.csv`,
              [['Date', 'Revenue', 'Orders', 'Units'], ...calc.series.map(s => [s.date, s.total, s.orders, s.units])],
            )
          }
        >
          <Download size={14} /> Export
        </Btn>
      </div>

      {summary && (
        <Card className="border-brand/30 bg-gradient-to-br from-brand-light/50 to-white">
          <CardTitle right={<Badge color="blue"><Sparkles size={11} className="mr-1" /> AI generated</Badge>}>
            Executive summary · {scope === 'all' ? 'all stores' : scope} · {range}d
          </CardTitle>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{summary}</p>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Revenue" value={compactINR(calc.stats.revenue)} hint={`${inr(calc.stats.revenue)}`} icon={<CircleDollarSign size={20} />} />
        <Stat label="Orders" value={String(calc.stats.orders)} hint={`AOV ${inr(calc.stats.aov)}`} icon={<ReceiptText size={20} />} />
        <Stat label="Units sold" value={String(calc.stats.units)} hint={`GST collected ${compactINR(calc.stats.tax)}`} icon={<Boxes size={20} />} />
        <Stat label="Gross margin" value={calc.stats.margin.toFixed(1) + '%'} delta={`${compactINR(calc.stats.profit)} gross profit`} down={calc.stats.margin < 18} icon={<Percent size={20} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardTitle>Revenue trend · {range} days</CardTitle>
          <TrendChart data={calc.series} />
        </Card>
        <Card>
          <CardTitle>Category mix</CardTitle>
          <DonutChart data={calc.cats} />
          <div className="flex flex-wrap gap-2 justify-center -mt-2">
            {calc.cats.slice(0, 5).map((c, i) => (
              <Badge key={c.name} color="slate" className="gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: ['#1428A0', '#00A9E0', '#7C3AED', '#F59E0B', '#10B981'][i] }} />
                {c.name} · {compactINR(c.value)}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Store comparison · {range} days</CardTitle>
          <HBars
            data={calc.perf.map(p => ({ name: p.storeId.toUpperCase(), revenue: p.revenue }))}
            yKey="name"
            xKey="revenue"
          />
        </Card>
        <Card>
          <CardTitle>
            Demand forecast · next 14 days
            <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
              Trend regression + weekday seasonality · shaded band = 80% confidence
            </span>
          </CardTitle>
          <ForecastChart actual={calc.series.slice(-30)} forecastData={calc.fc} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl bg-brand-light p-3 text-center">
              <div className="text-lg font-bold text-brand">{compactINR(forecastNext7)}</div>
              <div className="text-[11px] text-slate-500">Projected next 7 days</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-lg font-bold text-ink">{compactINR(last7Actual)}</div>
              <div className="text-[11px] text-slate-500">Actual last 7 days</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <CardTitle>Payment mix</CardTitle>
          <DonutChart
            data={calc.pays.filter(p => p.value > 0).map(p => ({ name: PAY_LABEL[p.name], value: p.value }))}
            height={220}
          />
          <div className="space-y-1.5 mt-1">
            {calc.pays.filter(p => p.value > 0).map(p => (
              <div key={p.name} className="flex justify-between text-xs">
                <span className="text-slate-500">{PAY_LABEL[p.name]}</span>
                <span className="font-semibold text-ink">{compactINR(p.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle>Sales heatmap · day × hour (revenue)</CardTitle>
          <div className="space-y-1">
            <div className="grid grid-cols-[44px_repeat(12,1fr)] gap-1 text-[10px] text-slate-400">
              <span />
              {HOUR_LABELS.map(h => <span key={h} className="text-center">{h}</span>)}
            </div>
            {DOW_LABELS.map((d, di) => (
              <div key={d} className="grid grid-cols-[44px_repeat(12,1fr)] gap-1 items-center">
                <span className="text-[10px] font-semibold text-slate-400">{d}</span>
                {calc.hm[di].map((v, hi) => (
                  <div
                    key={hi}
                    title={`${d} ${HOUR_LABELS[hi]}: ${inr(Math.round(v))}`}
                    className="h-6 rounded-md transition hover:ring-2 hover:ring-brand/40"
                    style={{ background: v === 0 ? '#F1F5F9' : `rgba(20,40,160,${0.12 + 0.88 * (v / hmMax)})` }}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Use peak cells for staff rostering and promo timing. {scope === 'all' ? 'Aggregated across all stores.' : `Scoped to ${scope}.`}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card pad={false}>
          <CardTitle><span className="px-5 pt-5 block">Top products · {range} days</span></CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>#</Th><Th>Product</Th><Th className="text-right">Units</Th><Th className="text-right">Revenue</Th><Th className="text-right">Share</Th></tr></thead>
              <tbody>
                {calc.top.map((t, i) => (
                  <tr key={t.productId} className="hover:bg-slate-50/60">
                    <Td className="text-slate-400 font-bold">{i + 1}</Td>
                    <Td><span className="mr-2">{t.emoji}</span><span className="font-medium text-slate-800">{t.name}</span></Td>
                    <Td className="text-right">{t.units}</Td>
                    <Td className="text-right font-semibold">{inr(t.revenue)}</Td>
                    <Td className="text-right text-slate-500">{calc.stats.revenue > 0 ? ((t.revenue / calc.stats.revenue) * 100).toFixed(1) + '%' : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card pad={false}>
          <CardTitle>
            <span className="px-5 pt-5 block">
              ABC analysis · revenue concentration
              <span className="block text-[11px] font-normal text-slate-400 mt-0.5">A = top 80% cumulative · B = next 15% · C = tail</span>
            </span>
          </CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Class</Th><Th>Product</Th><Th className="text-right">Revenue</Th><Th className="text-right">Cumulative</Th></tr></thead>
              <tbody>
                {calc.abc.map(a => (
                  <tr key={a.productId} className="hover:bg-slate-50/60">
                    <Td><Badge color={a.cls === 'A' ? 'green' : a.cls === 'B' ? 'amber' : 'slate'}>{a.cls}</Badge></Td>
                    <Td><span className="font-medium text-slate-800">{a.name}</span><span className="text-[11px] text-slate-400 block">{a.category}</span></Td>
                    <Td className="text-right font-semibold">{inr(a.revenue)}</Td>
                    <Td className="text-right text-slate-500">{a.cumulative.toFixed(1)}%</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {calc.plan.length > 0 && (
        <Card pad={false}>
          <CardTitle><span className="px-5 pt-5 block">Restock urgency · {scope}</span></CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Product</Th><Th className="text-right">Stock</Th><Th className="text-right">Velocity</Th><Th className="text-right">Cover left</Th><Th className="text-right">Order</Th><Th className="text-right">Est. cost</Th></tr></thead>
              <tbody>
                {calc.plan.map(r => (
                  <tr key={r.product.id}>
                    <Td><span className="mr-2">{r.product.emoji}</span>{r.product.name}</Td>
                    <Td className="text-right font-bold">{r.stock}</Td>
                    <Td className="text-right text-slate-500">{r.velocity}/day</Td>
                    <Td className="text-right"><Badge color={r.daysLeft <= 3 ? 'rose' : 'amber'}>{r.daysLeft}d</Badge></Td>
                    <Td className="text-right font-semibold text-brand">{r.suggest}</Td>
                    <Td className="text-right">{inr(r.orderValue)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Shell title="Analytics" subtitle="Deep reports: trends, forecasts, ABC, heatmaps, payments and AI restock planning.">
      <AnalyticsInner />
    </Shell>
  );
}
