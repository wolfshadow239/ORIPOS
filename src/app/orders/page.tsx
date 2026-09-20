
'use client';

import { useMemo, useState } from 'react';
import Shell from '@/components/Shell';
import { useApp } from '@/components/Providers';
import { useData } from '@/components/hooks';
import { Card, Badge, Btn, Input, Select, Modal, Empty, Td, Th, Loading } from '@/components/ui';
import { refundOrder } from '@/lib/actions';
import { inr, fmtDateTime, PAY_LABEL } from '@/lib/format';
import { printOrder } from '@/components/Receipt';
import { Order } from '@/lib/types';
import { Search, Printer, RotateCcw, ReceiptText, Eye } from 'lucide-react';

function OrdersInner() {
  const { storeId, store, user } = useApp();
  const data = useData();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState<Order | null>(null);
  const [confirmRefund, setConfirmRefund] = useState<Order | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const query = q.trim().toLowerCase();
    return data.orders
      .filter(o => o.storeId === storeId)
      .filter(o => (status === 'all' ? true : o.status === status))
      .filter(o => {
        if (!query) return true;
        if (o.id.toLowerCase().includes(query)) return true;
        if (o.items.some(i => i.name.toLowerCase().includes(query))) return true;
        const c = o.customerId ? data.customers.find(x => x.id === o.customerId) : null;
        return c ? c.name.toLowerCase().includes(query) : false;
      })
      .slice()
      .reverse()
      .slice(0, 120);
  }, [data, q, status, storeId]);

  if (!data) return <Loading />;
  const canRefund = user!.role !== 'cashier';

  return (
    <Card pad={false}>
      <div className="p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search order ID, product or customer…" className="pl-9" />
        </div>
        <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
        </Select>
        <span className="text-xs text-slate-400">{rows.length} of {data.orders.filter(o => o.storeId === storeId).length} orders at {store.short}</span>
      </div>

      {rows.length === 0 ? (
        <Empty icon={<ReceiptText size={22} />} title="No orders found" body="Adjust your search or status filter." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Order</Th><Th>Date & time</Th><Th>Items</Th><Th>Payment</Th><Th>Customer</Th><Th>Cashier</Th>
                <Th className="text-right">GST</Th><Th className="text-right">Total</Th><Th>Status</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-brand whitespace-nowrap">{o.id}</Td>
                  <Td className="text-slate-500 whitespace-nowrap">{fmtDateTime(o.createdAt)}</Td>
                  <Td>{o.items.reduce((s, i) => s + i.qty, 0)}</Td>
                  <Td>{o.payments.map(p => PAY_LABEL[p.method]).join(' + ')}</Td>
                  <Td className="text-slate-600">{o.customerId ? data.customers.find(c => c.id === o.customerId)?.name || '—' : 'Walk-in'}</Td>
                  <Td className="text-slate-500">{o.cashier}</Td>
                  <Td className="text-right text-slate-500">{inr(o.tax)}</Td>
                  <Td className="text-right font-semibold text-ink">{inr(o.total)}</Td>
                  <Td><Badge color={o.status === 'refunded' ? 'rose' : 'green'}>{o.status}</Badge></Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-1">
                      <Btn size="sm" variant="ghost" onClick={() => setView(o)} title="View"><Eye size={14} /></Btn>
                      <Btn size="sm" variant="ghost" onClick={() => printOrder(o, store, data.settings, o.customerId ? data.customers.find(c => c.id === o.customerId) : undefined)} title="Print">
                        <Printer size={14} />
                      </Btn>
                      {canRefund && o.status === 'completed' && (
                        <Btn size="sm" variant="ghost" className="text-rose-500 hover:text-rose-600" onClick={() => setConfirmRefund(o)} title="Refund">
                          <RotateCcw size={14} />
                        </Btn>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.id} wide>
        {view && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400 font-semibold">DATE</div><div className="font-medium mt-0.5">{fmtDateTime(view.createdAt)}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400 font-semibold">CASHIER</div><div className="font-medium mt-0.5">{view.cashier}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400 font-semibold">PAYMENT</div><div className="font-medium mt-0.5">{view.payments.map(p => PAY_LABEL[p.method]).join(' + ')}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400 font-semibold">STATUS</div><div className="font-medium mt-0.5">{view.status}</div></div>
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate</Th><Th className="text-right">GST</Th><Th className="text-right">Amount</Th></tr></thead>
                <tbody>
                  {view.items.map((i, x) => (
                    <tr key={x}>
                      <Td>{i.name}{i.discount > 0 && <span className="text-emerald-600 text-xs"> (−{inr(i.discount)}/unit)</span>}</Td>
                      <Td className="text-right">{i.qty}</Td>
                      <Td className="text-right">{inr(i.price)}</Td>
                      <Td className="text-right text-slate-500">{i.gst}%</Td>
                      <Td className="text-right font-semibold">{inr((i.price - (i.discount || 0)) * i.qty)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{inr(view.subtotal)}</span></div>
                {view.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{inr(view.discount)}</span></div>}
                <div className="flex justify-between text-slate-500"><span>GST</span><span>{inr(view.tax)}</span></div>
                <div className="flex justify-between font-bold text-lg text-ink border-t border-dashed border-slate-200 pt-2"><span>Total</span><span>{inr(view.total)}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmRefund}
        onClose={() => setConfirmRefund(null)}
        title="Refund order?"
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirmRefund(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => { if (confirmRefund) refundOrder(confirmRefund.id); setConfirmRefund(null); }}>
              Refund {confirmRefund ? inr(confirmRefund.total) : ''}
            </Btn>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          This will mark <b>{confirmRefund?.id}</b> as refunded, return{' '}
          <b>{confirmRefund?.items.reduce((s, i) => s + i.qty, 0)} items</b> to {store.short} stock and reverse loyalty points.
          The action is recorded permanently.
        </p>
      </Modal>
    </Card>
  );
}

export default function OrdersPage() {
  return (
    <Shell title="Orders" subtitle="Search, reprint and manage every bill across the store.">
      <OrdersInner />
    </Shell>
  );
}
