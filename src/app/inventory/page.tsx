
'use client';

import { useMemo, useState } from 'react';
import Shell from '@/components/Shell';
import { useApp } from '@/components/Providers';
import { useData } from '@/components/hooks';
import { Card, Badge, Btn, Input, Select, Modal, Empty, Td, Th, Loading } from '@/components/ui';
import { adjustStock } from '@/lib/actions';
import { restockPlan } from '@/lib/ai';
import { inr, compactINR } from '@/lib/format';
import { downloadCSV } from '@/lib/export';
import { CATEGORIES } from '@/lib/products';
import { Product } from '@/lib/types';
import { Search, PackagePlus, Download, AlertTriangle, Boxes, Truck } from 'lucide-react';

function InventoryInner() {
  const { storeId, setStoreId, user } = useApp();
  const data = useData();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [onlyLow, setOnlyLow] = useState(false);
  const [adjust, setAdjust] = useState<{ p: Product; mode: 'in' | 'out' } | null>(null);
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('Purchase received');

  const plan = useMemo(() => {
    if (!data) return [];
    return restockPlan(data.orders, data.products, data.stock, storeId, 30);
  }, [data, storeId]);

  const planById = useMemo(() => new Map(plan.map(r => [r.product.id, r])), [plan]);

  const rows = useMemo(() => {
    if (!data) return [];
    const query = q.trim().toLowerCase();
    return data.products
      .map(p => ({ p, stock: data.stock[storeId]?.[p.id] ?? 0, info: planById.get(p.id) }))
      .filter(({ p }) => (cat === 'All' ? true : p.category === cat))
      .filter(({ p }) => !query || p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query))
      .filter(({ info }) => (onlyLow ? (info ? info.daysLeft <= data.settings.lowStockDays : false) : true));
  }, [data, q, cat, onlyLow, storeId, planById]);

  if (!data) return <Loading />;
  const lowCount = plan.filter(r => r.daysLeft <= data.settings.lowStockDays || r.stock === 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 rounded-xl bg-brand-light text-brand"><Boxes size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-ink">{data.products.length}</div>
            <div className="text-xs text-slate-500">Active SKUs in catalogue</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600"><AlertTriangle size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-ink">{lowCount}</div>
            <div className="text-xs text-slate-500">Below {data.settings.lowStockDays}-day cover</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><Truck size={20} /></div>
          <div>
            <div className="text-2xl font-bold text-ink">{compactINR(plan.reduce((s, r) => s + r.orderValue, 0))}</div>
            <div className="text-xs text-slate-500">Recommended restock investment (30d)</div>
          </div>
        </Card>
      </div>

      <Card pad={false}>
        <div className="p-5 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search product or SKU…" className="pl-9" />
          </div>
          <Select value={cat} onChange={e => setCat(e.target.value)}>
            <option value="All">All categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          {user!.role === 'admin' && (
            <Select value={storeId} onChange={e => setStoreId(e.target.value)}>
              {data.stores.map(s => <option key={s.id} value={s.id}>{s.short}</option>)}
            </Select>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} className="accent-brand w-4 h-4" />
            Low stock only
          </label>
          <div className="flex-1" />
          <Btn
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCSV(
                `orison-inventory-${storeId}.csv`,
                [['SKU', 'Product', 'Category', 'Price', 'Stock', 'Sold30', 'Velocity/day', 'Days of cover', 'Suggested order'],
                ...rows.map(({ p, stock, info }) => [
                  p.sku, p.name, p.category, p.price, stock, info?.sold30 ?? 0, info?.velocity ?? 0,
                  info ? (info.daysLeft === 999 ? '' : info.daysLeft) : '', info?.suggest ?? 0,
                ]),
              ])
            }
          >
            <Download size={14} /> Export CSV
          </Btn>
        </div>

        {rows.length === 0 ? (
          <Empty icon={<Boxes size={22} />} title="Nothing here" body="Try clearing filters or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Product</Th><Th>Category</Th><Th className="text-right">Price</Th><Th className="text-right">Stock</Th>
                  <Th className="text-right">Sold (30d)</Th><Th className="text-right">Velocity</Th><Th className="text-right">Cover</Th>
                  <Th className="text-right">Reorder</Th><Th>Status</Th><Th className="text-right">Adjust</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, stock, info }) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{p.emoji}</span>
                        <div>
                          <div className="font-medium text-slate-800">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.sku}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-slate-500">{p.category}</Td>
                    <Td className="text-right">{inr(p.price)}</Td>
                    <Td className="text-right font-bold">{stock}</Td>
                    <Td className="text-right text-slate-500">{info?.sold30 ?? 0}</Td>
                    <Td className="text-right text-slate-500">{info ? info.velocity : '—'}</Td>
                    <Td className="text-right text-slate-500">{info ? (info.daysLeft === 999 ? '—' : `~${info.daysLeft}d`) : '—'}</Td>
                    <Td className="text-right font-semibold text-brand">{info && info.suggest > 0 ? info.suggest : '—'}</Td>
                    <Td>
                      {stock === 0 ? <Badge color="rose">OUT OF STOCK</Badge>
                        : info && info.daysLeft <= data.settings.lowStockDays ? <Badge color="amber">LOW</Badge>
                        : <Badge color="green">OK</Badge>}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <Btn size="sm" variant="soft" onClick={() => setAdjust({ p, mode: 'in' })}><PackagePlus size={13} /> Stock</Btn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink text-sm tracking-wide flex items-center gap-2">
              <Truck size={15} className="text-brand" /> AI purchase plan · next 30 days
            </h3>
            <Badge color="blue">{plan.length} SKUs need action</Badge>
          </div>
          {plan.length === 0 ? (
            <Empty title="No replenishment needed" body="Every SKU has healthy cover for the next 3 weeks." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><Th>Product</Th><Th className="text-right">Stock</Th><Th className="text-right">Daily velocity</Th><Th className="text-right">Days left</Th><Th className="text-right">Order qty</Th><Th className="text-right">Est. cost</Th></tr></thead>
                <tbody>
                  {plan.slice(0, 12).map(r => (
                    <tr key={r.product.id}>
                      <Td><span className="mr-2">{r.product.emoji}</span>{r.product.name}</Td>
                      <Td className="text-right font-bold">{r.stock}</Td>
                      <Td className="text-right text-slate-500">{r.velocity}/day</Td>
                      <Td className="text-right">
                        <Badge color={r.daysLeft <= 3 ? 'rose' : r.daysLeft <= 10 ? 'amber' : 'slate'}>
                          {r.daysLeft === 999 ? '—' : `${r.daysLeft}d`}
                        </Badge>
                      </Td>
                      <Td className="text-right font-semibold text-brand">{r.suggest}</Td>
                      <Td className="text-right">{inr(r.orderValue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Modal
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title={adjust ? `Adjust stock — ${adjust.p.name}` : ''}
        footer={
          <>
            <Btn variant="outline" onClick={() => setAdjust(null)}>Cancel</Btn>
            <Btn
              onClick={() => {
                if (!adjust) return;
                const n = Math.max(1, Math.floor(Number(qty) || 1));
                adjustStock(adjust.p.id, storeId, adjust.mode === 'in' ? n : -n, reason || (adjust.mode === 'in' ? 'Stock in' : 'Stock out'));
                setAdjust(null);
                setQty('1');
              }}
            >
              Confirm {adjust?.mode === 'in' ? 'stock in' : 'stock out'}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Btn variant={adjust?.mode === 'in' ? 'primary' : 'outline'} className="flex-1" onClick={() => setAdjust(a => a && { ...a, mode: 'in' })}>➕ Stock in</Btn>
            <Btn variant={adjust?.mode === 'out' ? 'danger' : 'outline'} className="flex-1" onClick={() => setAdjust(a => a && { ...a, mode: 'out' })}>➖ Stock out</Btn>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">QUANTITY</label>
            <Input type="number" min={1} className="mt-1.5" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">REASON</label>
            <Select className="mt-1.5 w-full" value={reason} onChange={e => setReason(e.target.value)}>
              <option>Purchase received</option>
              <option>Inter-store transfer in</option>
              <option>Customer return</option>
              <option>Stock out / damage</option>
              <option>Inter-store transfer out</option>
              <option>Cycle count correction</option>
            </Select>
          </div>
          <p className="text-[11px] text-slate-400">
            Current stock at this store: <b>{adjust ? data.stock[storeId]?.[adjust.p.id] ?? 0 : 0}</b>. All adjustments are audit-logged.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Shell title="Inventory" subtitle="Live stock per store, velocity, cover days and AI-driven purchase plan.">
      <InventoryInner />
    </Shell>
  );
}
