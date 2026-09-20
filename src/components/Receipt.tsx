
'use client';

import { Order, Store, Customer } from '@/lib/types';
import { Settings } from '@/lib/db';
import { inr, fmtDateTime, PAY_LABEL } from '@/lib/format';
import { Modal, Btn } from './ui';
import { Printer } from 'lucide-react';

function receiptHTML(order: Order, store: Store, settings: Settings, customer?: Customer): string {
  const rows = order.items
    .map(
      i => `<tr>
        <td style="padding:3px 0">${i.name}<br/><span style="color:#666;font-size:10px">${i.qty} × ${inr(i.price)}${i.discount ? ' · disc ' + inr(i.discount) : ''} · GST ${i.gst}%</span></td>
        <td style="padding:3px 0;text-align:right;vertical-align:top">${inr((i.price - (i.discount || 0)) * i.qty)}</td>
      </tr>`,
    )
    .join('');
  const pays = order.payments
    .map(p => `<tr><td style="padding:2px 0">${PAY_LABEL[p.method]}</td><td style="text-align:right;padding:2px 0">${inr(p.amount)}</td></tr>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${order.id}</title>
  <style>
    body{font-family:ui-monospace,Menlo,monospace;font-size:12px;width:300px;margin:0 auto;padding:12px;color:#111}
    .c{text-align:center}.b{border-top:1px dashed #999;margin:8px 0}
    table{width:100%;border-collapse:collapse}td{vertical-align:top}
    .tot{font-size:15px;font-weight:700}
  </style></head><body>
  <div class="c">
    <div style="font-size:15px;font-weight:700">ORISON RETAIL</div>
    <div>${store.name}</div>
    <div>${store.area}, ${store.city} · ${store.phone}</div>
    <div>GSTIN: ${settings.gstin}</div>
  </div>
  <div class="b"></div>
  <table>
    <tr><td>Bill: <b>${order.id}</b></td><td style="text-align:right">${fmtDateTime(order.createdAt)}</td></tr>
    <tr><td>Cashier: ${order.cashier}</td><td style="text-align:right">${customer ? 'Cust: ' + customer.name : 'Walk-in'}</td></tr>
  </table>
  <div class="b"></div>
  <table>${rows}</table>
  <div class="b"></div>
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${inr(order.subtotal)}</td></tr>
    ${order.discount > 0 ? `<tr><td>Order discount</td><td style="text-align:right">−${inr(order.discount)}</td></tr>` : ''}
    <tr><td>GST</td><td style="text-align:right">${inr(order.tax)}</td></tr>
    <tr class="tot"><td>TOTAL</td><td style="text-align:right">${inr(order.total)}</td></tr>
  </table>
  <div class="b"></div>
  <table>${pays}</table>
  <div class="b"></div>
  <div class="c" style="font-size:10px;color:#444">${settings.receiptFooter}</div>
  <div class="c" style="margin-top:6px">*** ${order.status === 'refunded' ? 'REFUNDED COPY' : 'CUSTOMER COPY'} ***</div>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`;
}

export function printOrder(order: Order, store: Store, settings: Settings, customer?: Customer): void {
  const w = window.open('', '_blank', 'width=380,height=640');
  if (!w) return;
  w.document.write(receiptHTML(order, store, settings, customer));
  w.document.close();
}

export function ReceiptModal({
  order,
  store,
  settings,
  customer,
  onClose,
  onNew,
}: {
  order: Order | null;
  store: Store;
  settings: Settings;
  customer?: Customer;
  onClose: () => void;
  onNew?: () => void;
}) {
  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          Sale complete <span className="text-brand">✓</span>
        </span>
      }
      footer={
        <>
          {onNew && (
            <Btn variant="outline" onClick={onNew}>New sale</Btn>
          )}
          <Btn onClick={() => order && printOrder(order, store, settings, customer)}>
            <Printer size={15} /> Print receipt
          </Btn>
        </>
      }
    >
      {order && (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{inr(order.total)}</div>
            <div className="text-xs text-emerald-600 mt-1">
              {order.id} · {order.items.reduce((s, i) => s + i.qty, 0)} items · GST {inr(order.tax)} included
            </div>
          </div>
          <div className="space-y-2">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-600">{i.qty} × {i.name}</span>
                <span className="font-medium">{inr((i.price - (i.discount || 0)) * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500"><span>Payments</span><span>{order.payments.map(p => PAY_LABEL[p.method]).join(' + ')}</span></div>
            {customer && (
              <div className="flex justify-between text-violet-600 font-medium">
                <span>Loyalty earned</span>
                <span>+{Math.floor(order.total / 100)} pts (balance {customer.points + Math.floor(order.total / 100)})</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
