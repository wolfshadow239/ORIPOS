
'use client';

import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { TrendingDown, TrendingUp, X } from 'lucide-react';

export function cn(...c: (string | false | undefined | null)[]): string {
  return c.filter(Boolean).join(' ');
}

export function Card({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-card border border-slate-200/70', pad && 'p-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-ink text-sm tracking-wide">{children}</h3>
      {right}
    </div>
  );
}

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft' | 'dark';
export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-brand hover:bg-brand-dark text-white shadow-sm',
    dark: 'bg-ink hover:bg-slate-800 text-white',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    soft: 'bg-brand-light text-brand hover:bg-blue-100',
  };
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-4 py-2 text-sm';
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed', v[variant], s, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = 'slate', className }: { children: ReactNode; color?: string; className?: string }) {
  const c: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-brand-light text-brand',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    violet: 'bg-violet-100 text-violet-700',
    dark: 'bg-ink text-white',
  };
  return <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', c[color] || c.slate, className)}>{children}</span>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition', className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-lift w-full max-h-[90vh] flex flex-col', wide ? 'max-w-3xl' : 'max-w-md')}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  delta,
  down,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  down?: boolean;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between p-5">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-[22px] leading-7 font-bold text-ink mt-1 truncate">{value}</div>
        {delta && (
          <div className={cn('text-xs mt-1 flex items-center gap-1 font-semibold', down ? 'text-rose-600' : 'text-emerald-600')}>
            {down ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {delta}
          </div>
        )}
        {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
      </div>
      {Icon && <div className="p-2.5 rounded-xl bg-brand-light text-brand shrink-0">{Icon}</div>}
    </Card>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-3 whitespace-nowrap', className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-sm border-t border-slate-100 align-middle', className)}>{children}</td>;
}

export function Empty({ icon, title, body }: { icon?: ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {icon && <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 mb-3">{icon}</div>}
      <div className="font-semibold text-slate-600">{title}</div>
      {body && <div className="text-sm text-slate-400 mt-1 max-w-xs">{body}</div>}
    </div>
  );
}

export function Progress({ value, color = 'bg-brand' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: Math.min(100, Math.max(0, value)) + '%' }} />
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200/70 animate-pulse" />
      ))}
    </div>
  );
}
