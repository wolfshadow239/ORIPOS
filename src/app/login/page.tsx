
'use client';

import { FormEvent, useState } from 'react';
import { useApp } from '@/components/Providers';
import { authenticate } from '@/lib/auth';
import { STORES } from '@/lib/stores';
import { Btn, Input } from '@/components/ui';
import { Smartphone, Sparkles, BarChart3, ShieldCheck, Store as StoreIcon } from 'lucide-react';

const QUICK = ['Aarav Mehta', 'Priya Nair', 'Rohan Kale'];

export default function LoginPage() {
  const { login } = useApp();
  const [name, setName] = useState('Aarav Mehta');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const u = authenticate(name, pin || 'orison123');
    if (!u) {
      setError('Invalid credentials. Demo PIN is orison123.');
      return;
    }
    login(u);
  };

  return (
    <div className="min-h-screen flex bg-brand-deep">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-12 bg-gradient-to-br from-brand-deep via-[#0d1a5e] to-brand relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-16 w-72 h-72 rounded-full bg-brand/40 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-brand-accent flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-brand/50">
            O
          </div>
          <div>
            <div className="text-white font-bold text-lg tracking-tight">Orison Retail</div>
            <div className="text-slate-400 text-xs">Samsung Experience Stores · Pune</div>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
            One POS for all<br />nine stores.
          </h1>
          <p className="text-slate-300 mt-4 max-w-md text-sm leading-relaxed">
            Lightning checkout, live inventory, AI demand forecasts and executive-grade analytics — built for Orison Retail.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: Smartphone, t: 'Smart POS', d: 'Barcode, holds, split payments' },
              { icon: Sparkles, t: 'AI Insights', d: 'Forecasts & auto restock' },
              { icon: BarChart3, t: 'Deep Analytics', d: 'ABC, margins, heatmaps' },
              { icon: ShieldCheck, t: 'Role-based', d: 'Admin · Manager · Cashier' },
            ].map(f => (
              <div key={f.t} className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur">
                <f.icon size={18} className="text-brand-accent" />
                <div className="text-white text-sm font-semibold mt-2">{f.t}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-slate-500 text-xs">
          <StoreIcon size={13} />
          {STORES.length} stores · {STORES.map(s => s.short).join(' · ')}
        </div>
      </div>

      {/* Login panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand to-brand-accent flex items-center justify-center text-white font-extrabold text-lg">
              O
            </div>
            <div className="text-ink font-bold text-lg">Orison POS</div>
          </div>

          <div className="bg-white rounded-3xl shadow-lift border border-slate-200/70 p-8">
            <h2 className="text-xl font-bold text-ink">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Welcome back. Pick a profile and enter your PIN.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Profile</label>
                <div className="flex gap-2 mt-2">
                  {QUICK.map(n => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => { setName(n); setError(''); }}
                      className={
                        'flex-1 px-2 py-2 rounded-xl border text-xs font-medium transition ' +
                        (name === n ? 'border-brand bg-brand-light text-brand' : 'border-slate-200 text-slate-500 hover:bg-slate-50')
                      }
                    >
                      {n.split(' ')[0]}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {n === 'Aarav Mehta' ? 'Admin' : n === 'Priya Nair' ? 'Manager' : 'Cashier'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">PIN</label>
                <Input
                  type="password"
                  className="mt-2"
                  placeholder="Demo PIN: orison123"
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(''); }}
                />
                {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
              </div>

              <Btn type="submit" size="lg" className="w-full">Sign in to Orison POS</Btn>
              <p className="text-[11px] text-slate-400 text-center">
                Demo build — any profile signs in with PIN <b>orison123</b>.
              </p>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">© 2026 Orison Retail Pvt. Ltd. · Powered by Orison POS</p>
        </div>
      </div>
    </div>
  );
}
