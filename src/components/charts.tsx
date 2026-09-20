
'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
} from 'recharts';
import { compactINR } from '@/lib/format';

export const PALETTE = ['#1428A0', '#00A9E0', '#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#64748B', '#EC4899'];

const axisStyle = { fontSize: 11, fill: '#94A3B8' };
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(10,18,48,.12)',
};

export function TrendChart({
  data,
  xKey = 'label',
  yKey = 'total',
  height = 280,
}: {
  data: any[];
  xKey?: string;
  yKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gBrand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1428A0" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#1428A0" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => compactINR(Number(v))} width={56} />
        <Tooltip
          formatter={(v) => [compactINR(Number(v)), 'Revenue']}
          contentStyle={tooltipStyle}
        />
        <Area type="monotone" dataKey={yKey} stroke="#1428A0" strokeWidth={2.5} fill="url(#gBrand)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 260 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => compactINR(Number(v))} contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HBars({
  data,
  yKey,
  xKey,
  height = 300,
}: {
  data: any[];
  yKey: string;
  xKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => compactINR(Number(v))} />
        <YAxis type="category" dataKey={yKey} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={110} />
        <Tooltip formatter={(v) => compactINR(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F9' }} />
        <Bar dataKey={xKey} fill="#1428A0" radius={[0, 8, 8, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ForecastChart({
  actual,
  forecastData,
  height = 300,
}: {
  actual: { label: string; total: number }[];
  forecastData: { label: string; forecast: number; lo: number; hi: number }[];
  height?: number;
}) {
  const merged = [
    ...actual.map(a => ({ label: a.label, actual: a.total, forecast: undefined as number | undefined, lo: undefined as number | undefined, band: undefined as number | undefined })),
    ...forecastData.map(f => ({
      label: f.label,
      actual: undefined as number | undefined,
      forecast: f.forecast,
      lo: f.lo,
      band: Math.max(0, f.hi - f.lo),
    })),
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={merged} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => compactINR(Number(v))} width={56} />
        <Tooltip formatter={(v, name) => [compactINR(Number(v)), name === 'actual' ? 'Actual' : name === 'forecast' ? 'Forecast' : '']} contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="lo" stackId="band" stroke="none" fill="#00A9E0" fillOpacity={0.12} name="lo" />
        <Area type="monotone" dataKey="band" stackId="band" stroke="none" fill="#00A9E0" fillOpacity={0.12} name="band" />
        <Line type="monotone" dataKey="actual" stroke="#1428A0" strokeWidth={2.5} dot={false} name="actual" />
        <Line type="monotone" dataKey="forecast" stroke="#00A9E0" strokeWidth={2.5} strokeDasharray="6 4" dot={false} name="forecast" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function Spark({ data, yKey = 'total', height = 44 }: { data: any[]; yKey?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gSpark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1428A0" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#1428A0" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={yKey} stroke="#1428A0" strokeWidth={1.8} fill="url(#gSpark)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
