
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Store as StoreIcon, LogOut, CalendarDays } from 'lucide-react';
import { useApp } from './Providers';
import { useData } from './hooks';
import { lowStockList } from '@/lib/ai';
import { STORES } from '@/lib/stores';
import { Badge, cn } from './ui';

export default function Topbar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const { user, store, storeId, setStoreId, logout } = useApp();
  const data = useData();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user || !data) return null;
  const low = lowStockList(data.products, data.stock, storeId, data.orders, data.settings);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/80">
      <div className="px-4 sm:px-6 py-3.5 flex items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>}
        </div>

        <div className="flex-1" />

        <form
          className="hidden md:flex items-center relative"
          onSubmit={e => {
            e.preventDefault();
            if (q.trim()) router.push('/pos?scan=' + encodeURIComponent(q.trim()));
            setQ('');
          }}
        >
          <Search size={15} className="absolute left-3 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search product / SKU… (Enter to sell)"
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm w-64 outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition"
          />
        </form>

        {user.role === 'admin' ? (
          <div className="relative hidden sm:block">
            <StoreIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand appearance-none cursor-pointer"
            >
              {STORES.map(s => (
                <option key={s.id} value={s.id}>{s.name.replace('Orison Retail - ', '')}</option>
              ))}
            </select>
          </div>
        ) : (
          <Badge color="blue" className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3">
            <StoreIcon size={12} /> {store.short}
          </Badge>
        )}

        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays size={14} /> {today}
        </div>

        <div className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className={cn('relative p-2.5 rounded-xl border transition', notifOpen ? 'bg-brand-light border-brand/30 text-brand' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}
          >
            <Bell size={16} />
            {low.length > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{low.length}</span>}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lift border border-slate-200 z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-ink">
                  Low stock alerts · {store.short}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {low.length === 0 && <div className="px-4 py-6 text-sm text-slate-400 text-center">All stocked up. Nice. 🎉</div>}
                  {low.slice(0, 10).map(l => (
                    <div key={l.product.id} className="px-4 py-2.5 border-b border-slate-50 flex items-center gap-3">
                      <span className="text-lg">{l.product.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-700 truncate">{l.product.name}</div>
                        <div className="text-[11px] text-slate-400">{l.stock} left · {l.daysLeft === 999 ? 'no recent sales' : `~${l.daysLeft}d of cover`}</div>
                      </div>
                      <Badge color={l.stock === 0 ? 'rose' : 'amber'}>{l.stock === 0 ? 'OUT' : 'LOW'}</Badge>
                    </div>
                  ))}
                </div>
                {low.length > 0 && (
                  <button onClick={() => { setNotifOpen(false); router.push('/inventory'); }} className="w-full px-4 py-2.5 text-xs font-semibold text-brand hover:bg-brand-light transition">
                    Open inventory →
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <button onClick={logout} className="lg:hidden p-2.5 rounded-xl border border-slate-200 text-slate-500">
          <LogOut size={16} />
        </button>

        {actions}
      </div>
    </header>
  );
}
