
'use client';

import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { useApp } from '@/components/Providers';
import { useData } from '@/components/hooks';
import { Card, CardTitle, Badge, Btn, Input, Select, Modal, Td, Th, Loading } from '@/components/ui';
import { addUser, updateSettings } from '@/lib/actions';
import { resetDB } from '@/lib/db';
import { downloadCSV, downloadJSON } from '@/lib/export';
import { Role } from '@/lib/types';
import { ShieldCheck, Download, RefreshCw, Database, UserPlus, BrainCircuit, Store as StoreIcon } from 'lucide-react';

const ROLE_COLOR: Record<string, string> = { admin: 'dark', manager: 'blue', cashier: 'green' };

function SettingsInner() {
  const { storeId, user, refresh } = useApp();
  const data = useData();
  const [tab, setTab] = useState<'general' | 'team' | 'data'>('general');
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('cashier');
  const [uStore, setUStore] = useState('amanora');
  const [pin, setPin] = useState('orison123');
  const [gstin, setGstin] = useState('');
  const [footer, setFooter] = useState('');
  const [lowDays, setLowDays] = useState(10);

  // Prime form values as soon as settings are available (and on reset)
  useEffect(() => {
    if (!data) return;
    setGstin(data.settings.gstin);
    setFooter(data.settings.receiptFooter);
    setLowDays(data.settings.lowStockDays);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.settings.gstin, data?.settings.receiptFooter, data?.settings.lowStockDays]);

  if (!data || !user) return <Loading />;

  const loadIntoForm = () => {
    setGstin(data.settings.gstin);
    setFooter(data.settings.receiptFooter);
    setLowDays(data.settings.lowStockDays);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['general', 'team', 'data'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'general') loadIntoForm(); }}
            className={'px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ' + (tab === t ? 'bg-brand text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}
          >
            {t === 'general' ? 'Business' : t === 'team' ? 'Team & roles' : 'Data & AI'}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardTitle right={<StoreIcon size={16} className="text-brand" />}>Business profile</CardTitle>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">TRADING NAME</label>
                <Input className="mt-1.5" value="Orison Retail Pvt. Ltd." readOnly />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">GSTIN</label>
                <Input className="mt-1.5" value={gstin} onChange={e => setGstin(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">LOW STOCK COVER (DAYS)</label>
                <Input type="number" min={1} className="mt-1.5" value={lowDays} onChange={e => setLowDays(Number(e.target.value) || 10)} />
              </div>
              <Btn onClick={() => updateSettings({ gstin, receiptFooter: footer, lowStockDays: lowDays || 10 })}>
                Save changes
              </Btn>
            </div>
          </Card>
          <Card>
            <CardTitle>Receipt footer</CardTitle>
            <textarea
              className="w-full h-40 px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
              value={footer}
              onChange={e => setFooter(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-2">Printed at the bottom of every customer receipt.</p>
          </Card>
          <Card className="xl:col-span-2">
            <CardTitle>Store network</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.stores.map(s => (
                <div key={s.id} className={'rounded-2xl border p-4 transition ' + (s.id === storeId ? 'border-brand bg-brand-light' : 'border-slate-200 hover:border-brand/40')}>
                  <div className="font-semibold text-sm text-ink">{s.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{s.area}, {s.city} · {s.phone}</div>
                  {s.id === storeId && <Badge color="blue" className="mt-2">Active view</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'team' && (
        <Card pad={false}>
          <div className="p-5 flex items-center justify-between">
            <CardTitle>Team & role-based access</CardTitle>
            <Btn onClick={() => setAddOpen(true)}><UserPlus size={15} /> Add member</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><Th>Name</Th><Th>Role</Th><Th>Store access</Th><Th>Permissions</Th></tr></thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-accent text-white text-xs font-bold flex items-center justify-center">
                          {u.name.split(' ').map(x => x[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                        {u.id === user.id && <Badge color="blue">you</Badge>}
                      </div>
                    </Td>
                    <Td><Badge color={ROLE_COLOR[u.role]}><ShieldCheck size={10} className="mr-1" />{u.role}</Badge></Td>
                    <Td className="text-slate-500">{u.role === 'admin' ? 'All 9 stores' : data.stores.find(s => s.id === u.storeId)?.name || '—'}</Td>
                    <Td className="text-slate-500 text-xs">
                      {u.role === 'admin' ? 'Full access incl. settings & analytics' : u.role === 'manager' ? 'Inventory, analytics, customers, refunds' : 'POS + own orders only'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'data' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardTitle right={<Download size={16} className="text-brand" />}>Export centre</CardTitle>
            <div className="space-y-3">
              <Btn variant="outline" className="w-full justify-start" onClick={() => downloadJSON('orison-pos-backup.json', { settings: data.settings, orders: data.db.orders, held: data.db.held, customers: data.customers, stock: data.stock, users: data.users, adjustments: data.db.adjustments })}>
                <Download size={15} /> Full backup (JSON)
              </Btn>
              <Btn
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  downloadCSV(
                    'orison-orders.csv',
                    [['Order', 'Store', 'Date', 'Items', 'Subtotal', 'Discount', 'GST', 'Total', 'Status', 'Cashier'],
                    ...data.orders.map(o => [o.id, o.storeId, new Date(o.createdAt).toISOString(), o.items.reduce((s, i) => s + i.qty, 0), o.subtotal, o.discount, o.tax, o.total, o.status, o.cashier])],
                  )
                }
              >
                <Download size={15} /> All orders (CSV)
              </Btn>
              <Btn
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  downloadCSV(
                    'orison-stock.csv',
                    [['Store', 'SKU', 'Product', 'Stock'],
                    ...data.stores.flatMap(s => data.products.map(p => [s.id, p.sku, p.name, data.stock[s.id]?.[p.id] ?? 0]))],
                  )
                }
              >
                <Download size={15} /> Stock across all stores (CSV)
              </Btn>
            </div>
          </Card>
          <Card>
            <CardTitle right={<BrainCircuit size={16} className="text-brand" />}>AI configuration</CardTitle>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                All AI features — demand forecasting, restock planning, anomaly detection and smart attach suggestions — run <b>locally in the browser</b>. Nothing blocks deployment and no key is required.
              </p>
              <p>
                Optionally set <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">OPENAI_API_KEY</code> in Vercel environment variables to upgrade the Analytics summary to GPT-powered prose. Without it, the local engine answers automatically.
              </p>
              <div className="rounded-xl bg-brand-light border border-blue-200 p-3 text-xs text-brand">
                AI engine status: <b>Local · active</b> · {data.orders.length.toLocaleString('en-IN')} orders analysed
              </div>
            </div>
          </Card>
          <Card className="xl:col-span-2 border-rose-200">
            <CardTitle right={<Database size={16} className="text-rose-500" />}>Danger zone</CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm text-slate-600 flex-1">
                Reset wipes live sales, customers, stock adjustments and team changes, then regenerates the 150-day demo dataset. Export a backup first.
              </p>
              <Btn
                variant="danger"
                onClick={() => {
                  if (confirm('Reset all data to the demo dataset? This cannot be undone.')) {
                    resetDB();
                    refresh();
                  }
                }}
              >
                <RefreshCw size={15} /> Reset demo data
              </Btn>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add team member"
        footer={
          <>
            <Btn variant="outline" onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn onClick={() => {
              if (!name.trim()) return;
              addUser(name.trim(), role, role === 'admin' ? null : uStore, pin || 'orison123');
              setAddOpen(false);
              setName('');
            }}>Add member</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">FULL NAME</label>
            <Input className="mt-1.5" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sneha Patil" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">ROLE</label>
            <Select className="mt-1.5 w-full" value={role} onChange={e => setRole(e.target.value as Role)}>
              <option value="cashier">Cashier — POS & orders only</option>
              <option value="manager">Manager — store ops + analytics</option>
              <option value="admin">Admin — everything, all stores</option>
            </Select>
          </div>
          {role !== 'admin' && (
            <div>
              <label className="text-xs font-semibold text-slate-500">HOME STORE</label>
              <Select className="mt-1.5 w-full" value={uStore} onChange={e => setUStore(e.target.value)}>
                {data.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500">PIN</label>
            <Input className="mt-1.5" value={pin} onChange={e => setPin(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Shell title="Settings" subtitle="Business profile, team access, data tools and AI configuration.">
      <SettingsInner />
    </Shell>
  );
}
