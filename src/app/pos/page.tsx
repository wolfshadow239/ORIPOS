'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Shell from '@/components/Shell';
import { useApp } from '@/components/Providers';
import { useData } from '@/components/hooks';
import { CATEGORIES } from '@/lib/products';
import { inr, PAY_LABEL } from '@/lib/format';
import { computeTotals } from '@/lib/compute';
import {
  checkout,
  holdOrder,
  resumeHeld,
  deleteHeld,
  addCustomer as addCustomerAction,
} from '@/lib/actions';
import { coBuySuggestions } from '@/lib/ai';
import { Order, OrderItem, Payment, PayMethod, Product } from '@/lib/types';
// ✅ FIX #1: Added `Card` import. Removed unused `Badge` (FIX #7).
import { Btn, Input, Select, Modal, Empty, cn, Card } from '@/components/ui';
import { ReceiptModal } from '@/components/Receipt';
import {
  Search, Plus, Minus, Trash2, Pause, ScanBarcode, Sparkles, Wallet, Banknote,
  CreditCard, QrCode, Clock3, UserPlus, X,
} from 'lucide-react';

interface CartLine {
  productId: string;
  qty: number;
  discount: number;
}

const PAY_ICONS: Record<PayMethod, React.ReactNode> = {
  upi: <QrCode size={15} />,
  card: <CreditCard size={15} />,
  cash: <Banknote size={15} />,
  credit: <Wallet size={15} />,
};

// ✅ FIX #6 (helper): moved `round` to module scope so it can be used anywhere
// without relying on hoisting inside the component body.
function round(n: number) {
  return Math.round(n * 100) / 100;
}

function PosInner() {
  const { storeId, store, user } = useApp();
  const data = useData();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [orderDisc, setOrderDisc] = useState(0);
  const [customerId, setCustomerId] = useState('');
  const [payments, setPayments] = useState<Payment[]>([{ method: 'upi', amount: 0 }]);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [holdNote, setHoldNote] = useState('');
  const [showHeld, setShowHeld] = useState(false);
  const [addCust, setAddCust] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [lineEdit, setLineEdit] = useState<CartLine | null>(null);
  const [err, setErr] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Barcode / deep-link scan + F2 shortcut
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scan = params.get('scan');
    if (scan) setSearch(scan);
    const focus = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focus);
    return () => window.removeEventListener('keydown', focus);
  }, []);

  const products = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.products.filter(p => {
      if (cat !== 'All' && p.category !== cat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [data, search, cat]);

  // ✅ FIX #2: Null-safe, memoized, filters out products that no longer exist.
  // Previously this used `data!` *before* the `if (!data)` guard and could
  // crash (or silently produce bad items) whenever `data` was null while
  // `cart.length > 0`.
  const cartItems: OrderItem[] = useMemo(() => {
    if (!data) return [];
    return cart
      .map(l => {
        const p = data.products.find(x => x.id === l.productId);
        if (!p) return null;
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          qty: l.qty,
          discount: l.discount,
          gst: p.gst,
        };
      })
      .filter((x): x is OrderItem => x !== null);
  }, [cart, data]);

  const totals = computeTotals(cartItems, orderDisc);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, round(totals.total - paid));
  const change = paid > totals.total ? round(paid - totals.total) : 0;
  const cartPids = cart.map(l => l.productId);

  // ✅ FIX #3: was passing `cartPids` twice (arg 2 and arg 4). The 4th arg is
  // the exclusion list, and the helper already excludes items in the cart,
  // so it should be `[]`.
  const suggestions =
    data && cart.length
      ? coBuySuggestions(data.seed.pairs, cartPids, data.products, [])
      : [];

  // ✅ FIX #7: `customer` was declared but never used — removed.

  function stockOf(pid: string): number {
    return data?.stock[storeId]?.[pid] ?? 0;
  }

  function addToCart(p: Product) {
    setErr('');
    const inCart = cart.find(l => l.productId === p.id)?.qty || 0;
    if (inCart + 1 > stockOf(p.id)) {
      setErr(`Only ${stockOf(p.id)} unit(s) of ${p.name} in stock at ${store.short}.`);
      return;
    }
    setCart(prev => {
      const ex = prev.find(l => l.productId === p.id);
      if (ex) return prev.map(l => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { productId: p.id, qty: 1, discount: 0 }];
    });
  }

  function setQty(pid: string, qty: number) {
    if (qty <= 0) return setCart(prev => prev.filter(l => l.productId !== pid));
    if (qty > stockOf(pid)) {
      setErr(`Only ${stockOf(pid)} in stock.`);
      return;
    }
    setCart(prev => prev.map(l => (l.productId === pid ? { ...l, qty } : l)));
  }

  function resetSale() {
    setCart([]);
    setOrderDisc(0);
    setCustomerId('');
    setPayments([{ method: 'upi', amount: 0 }]);
    setErr('');
    setHoldNote('');
  }

  function doCheckout() {
    if (!data || cart.length === 0) return;
    if (paid + 0.009 < totals.total) {
      setErr(`Insufficient payment — ${inr(remaining)} remaining.`);
      return;
    }
    const pays = payments
      .filter(p => p.amount > 0)
      .map(p => ({ ...p, amount: round(p.amount) }));
    if (pays.length === 0) pays.push({ method: 'upi', amount: totals.total });
    const order = checkout({
      storeId,
      items: cartItems,
      orderDiscountPct: orderDisc,
      payments: pays,
      customerId: customerId || undefined,
      cashier: user!.name,
    });
    setReceipt(order);
    resetSale();
  }

  // ✅ FIX #5: `holdNote` was collected in the UI but never passed through.
  // ✅ FIX #8: dropped the `void order;` noise; we don't need the return value.
  function doHold() {
    if (!data || cart.length === 0) return;
    holdOrder({
      storeId,
      items: cartItems,
      subtotal: totals.subtotal,
      discount: totals.orderDiscountAmt,
      tax: totals.tax,
      total: totals.total,
      payments: [],
      customerId: customerId || undefined,
      cashier: user!.name,
      createdAt: Date.now(),
      orderDiscountPct: orderDisc,
      note: holdNote, // ✅ FIX #5
    });
    resetSale();
    setShowHeld(false);
  }

  if (!data) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-64 rounded-2xl bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
      {/* ============ Catalogue ============ */}
      <div className="space-y-4 min-w-0">
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && products.length === 1) {
                    addToCart(products[0]);
                    setSearch('');
                  }
                }}
                placeholder="Search name / SKU, or scan barcode… (F2)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ScanBarcode size={15} /> Scanner-ready
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {['All', ...CATEGORIES].map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition',
                  cat === c
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Card>

        {suggestions.length > 0 && (
          <Card className="p-4 border-brand/30 bg-gradient-to-r from-brand-light/60 to-white">
            <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wide mb-3">
              <Sparkles size={13} /> Smart attach — frequently bought together
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-brand/25 hover:border-brand hover:shadow-card transition text-sm"
                >
                  <span>{p.emoji}</span>
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className="text-brand font-semibold">{inr(p.price)}</span>
                  <Plus size={13} className="text-brand" />
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3">
          {products.map(p => {
            const stock = stockOf(p.id);
            const inCart = cart.find(l => l.productId === p.id)?.qty || 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={stock === 0}
                className={cn(
                  'relative text-left bg-white rounded-2xl border border-slate-200/80 p-4 transition group',
                  stock === 0
                    ? 'opacity-45 cursor-not-allowed'
                    : 'hover:border-brand/40 hover:shadow-lift hover:-translate-y-0.5',
                  inCart > 0 && 'border-brand ring-2 ring-brand/15',
                )}
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <div className="text-[13px] font-semibold text-ink leading-snug line-clamp-2 min-h-[34px]">
                  {p.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{p.sku}</div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="font-bold text-brand">{inr(p.price)}</span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                      stock === 0
                        ? 'bg-rose-100 text-rose-600'
                        : stock < 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {stock === 0 ? 'OUT' : `${stock} left`}
                  </span>
                </div>
                {inCart > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shadow">
                    {inCart}
                  </span>
                )}
              </button>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full">
              <Empty
                title="No products match"
                body="Try a different search term or category."
              />
            </div>
          )}
        </div>
      </div>

      {/* ============ Cart ============ */}
      <Card className="xl:sticky xl:top-20 p-0 overflow-hidden">
        <div className="px-5 py-4 bg-ink text-white flex items-center justify-between">
          <div>
            <div className="font-bold">Current sale</div>
            <div className="text-[11px] text-slate-400">{store.name}</div>
          </div>
          <div className="flex items-center gap-2">
            {data.db.held.length > 0 && (
              <button
                onClick={() => setShowHeld(true)}
                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                title="Held orders"
              >
                <Clock3 size={15} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-ink text-[9px] font-bold flex items-center justify-center">
                  {data.db.held.length}
                </span>
              </button>
            )}
            {/* ✅ FIX #4: this button previously opened the held-orders list
                (same as the clock icon), which was misleading. It now actually
                holds the current sale, and the tooltip matches. */}
            <button
              onClick={doHold}
              disabled={cart.length === 0}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Hold current sale"
            >
              <Pause size={15} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto">
          {err && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 flex items-center justify-between">
              {err}
              <button onClick={() => setErr('')}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* Customer */}
          <div className="flex gap-2">
            <Select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="flex-1"
            >
              <option value="">Walk-in customer</option>
              {data.customers
                .filter(c => c.storeId === storeId)
                .slice(0, 300)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.points} pts
                  </option>
                ))}
            </Select>
            <Btn
              variant="outline"
              size="sm"
              className="px-2.5"
              onClick={() => setAddCust(true)}
              title="New customer"
            >
              <UserPlus size={15} />
            </Btn>
          </div>

          {/* Lines */}
          {cart.length === 0 ? (
            <Empty
              icon={<ScanBarcode size={22} />}
              title="Cart is empty"
              body="Tap products or scan a barcode to start a sale. Press F2 to jump to search."
            />
          ) : (
            <div className="space-y-2">
              {cartItems.map(item => (
                <div
                  key={item.productId}
                  className="rounded-xl border border-slate-200 p-3 hover:border-brand/30 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      className="text-left flex-1 min-w-0"
                      onClick={() =>
                        setLineEdit(
                          cart.find(l => l.productId === item.productId)!,
                        )
                      }
                    >
                      <div className="text-[13px] font-semibold text-ink leading-snug truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {inr(item.price)} · GST {item.gst}%
                        {item.discount > 0 && ` · −${inr(item.discount)}`}
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQty(item.productId, item.qty - 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => setQty(item.productId, item.qty + 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => setQty(item.productId, 0)}
                        className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-ink mt-1.5">
                    {inr((item.price - item.discount) * item.qty)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order discount */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
            <span className="text-xs font-semibold text-slate-500">
              ORDER DISCOUNT %
            </span>
            <input
              type="number"
              min={0}
              max={50}
              value={orderDisc || ''}
              placeholder="0"
              onChange={e =>
                setOrderDisc(
                  Math.min(50, Math.max(0, Number(e.target.value) || 0)),
                )
              }
              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm text-right outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Totals + payment */}
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{inr(totals.subtotal)}</span>
            </div>
            {(totals.itemDiscounts > 0 || totals.orderDiscountAmt > 0) && (
              <div className="flex justify-between text-emerald-600">
                <span>Discounts</span>
                <span>
                  −{inr(totals.itemDiscounts + totals.orderDiscountAmt)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>GST included</span>
              <span>{inr(totals.tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-ink pt-1.5 border-t border-dashed border-slate-200">
              <span>Total</span>
              <span>{inr(totals.total)}</span>
            </div>
          </div>

          {/* Split payments */}
          <div className="space-y-2">
            {payments.map((p, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex bg-white border border-slate-300 rounded-xl overflow-hidden">
                  {(['upi', 'card', 'cash', 'credit'] as PayMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() =>
                        setPayments(prev =>
                          prev.map((x, xi) =>
                            xi === i ? { ...x, method: m } : x,
                          ),
                        )
                      }
                      title={PAY_LABEL[m]}
                      className={cn(
                        'px-2.5 py-2 text-slate-500 transition',
                        p.method === m && 'bg-brand text-white',
                      )}
                    >
                      {PAY_ICONS[m]}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={0}
                  value={p.amount || ''}
                  placeholder="0"
                  onChange={e =>
                    setPayments(prev =>
                      prev.map((x, xi) =>
                        xi === i
                          ? { ...x, amount: Number(e.target.value) || 0 }
                          : x,
                      ),
                    )
                  }
                  className="flex-1 text-right"
                />
                {payments.length > 1 && (
                  <button
                    onClick={() =>
                      setPayments(prev => prev.filter((_, xi) => xi !== i))
                    }
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              {/* ✅ FIX #4 (cont.): split button was enabled even at ₹0
                  remaining, adding an empty payment row. Now disabled. */}
              <button
                onClick={() =>
                  setPayments(prev => [
                    ...prev,
                    { method: 'cash', amount: remaining },
                  ])
                }
                disabled={remaining <= 0}
                className="text-xs font-semibold text-brand hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed"
              >
                + Split payment
              </button>
              <button
                onClick={() =>
                  setPayments(prev =>
                    prev
                      .map((x, i) =>
                        i === 0 ? { ...x, amount: totals.total } : x,
                      )
                      .slice(0, 1),
                  )
                }
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Full via {PAY_LABEL[payments[0]?.method || 'upi']}
              </button>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <span>Change to return</span>
                <span>{inr(change)}</span>
              </div>
            )}
            {remaining > 0 && paid > 0 && (
              <div className="flex justify-between text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span>Remaining</span>
                <span>{inr(remaining)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Btn
              variant="outline"
              className="flex-1"
              onClick={doHold}
              disabled={cart.length === 0}
            >
              <Pause size={14} /> Hold
            </Btn>
            <Btn
              variant="dark"
              className="flex-[2]"
              size="lg"
              onClick={doCheckout}
              disabled={cart.length === 0}
            >
              Charge {inr(totals.total)}
            </Btn>
          </div>
        </div>
      </Card>

      {/* ============ Modals ============ */}
      <Modal
        open={showHeld}
        onClose={() => setShowHeld(false)}
        title={`Held orders · ${data.db.held.length}`}
        footer={
          <>
            <Input
              placeholder="Note (e.g. customer name)…"
              value={holdNote}
              onChange={e => setHoldNote(e.target.value)}
              className="flex-1"
            />
            <Btn onClick={doHold} disabled={cart.length === 0}>
              Hold current sale
            </Btn>
          </>
        }
      >
        {data.db.held.length === 0 ? (
          <Empty
            title="No held orders"
            body="Park in-progress sales here and resume them anytime."
          />
        ) : (
          <div className="space-y-2">
            {data.db.held.map(h => (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
              >
                <Clock3 size={16} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">
                    {h.id}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {h.items.reduce((s, i) => s + i.qty, 0)} items ·{' '}
                    {inr(h.total)} · {h.cashier}
                  </div>
                </div>
                <Btn
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    const o = resumeHeld(h.id);
                    if (o) {
                      setCart(
                        o.items.map(i => ({
                          productId: i.productId,
                          qty: i.qty,
                          discount: i.discount,
                        })),
                      );
                      setOrderDisc(o.orderDiscountPct || 0);
                      setCustomerId(o.customerId || '');
                    }
                    setShowHeld(false);
                  }}
                >
                  Resume
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteHeld(h.id)}
                >
                  <Trash2 size={13} />
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={addCust}
        onClose={() => setAddCust(false)}
        title="New customer"
        footer={
          <>
            <Btn variant="outline" onClick={() => setAddCust(false)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                if (!custName.trim()) return;
                const c = addCustomerAction(
                  custName.trim(),
                  custPhone.trim() || '+91 ',
                  storeId,
                );
                setCustomerId(c.id);
                setAddCust(false);
                setCustName('');
                setCustPhone('');
              }}
            >
              Save & attach
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">
              Full name
            </label>
            <Input
              className="mt-1.5"
              value={custName}
              onChange={e => setCustName(e.target.value)}
              placeholder="e.g. Ananya Iyer"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Phone</label>
            <Input
              className="mt-1.5"
              value={custPhone}
              onChange={e => setCustPhone(e.target.value)}
              placeholder="+91 98XXX XXXXX"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Earns 1 loyalty point per ₹100 spent. Points redeemable across all 9
            Orison stores.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!lineEdit}
        onClose={() => setLineEdit(null)}
        title="Edit line item"
        footer={
          <>
            <Btn variant="outline" onClick={() => setLineEdit(null)}>
              Done
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                if (lineEdit) setQty(lineEdit.productId, 0);
                setLineEdit(null);
              }}
            >
              Remove item
            </Btn>
          </>
        }
      >
        {lineEdit && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-ink">
              {data.products.find(p => p.id === lineEdit.productId)?.name}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                LINE DISCOUNT (₹ PER UNIT)
              </label>
              <Input
                type="number"
                min={0}
                className="mt-1.5"
                value={lineEdit.discount || ''}
                onChange={e => {
                  const d = Math.max(0, Number(e.target.value) || 0);
                  setCart(prev =>
                    prev.map(l =>
                      l.productId === lineEdit.productId
                        ? { ...l, discount: d }
                        : l,
                    ),
                  );
                  setLineEdit({ ...lineEdit, discount: d });
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      <ReceiptModal
        order={receipt}
        store={store}
        settings={data.settings}
        customer={
          receipt?.customerId
            ? data.customers.find(c => c.id === receipt.customerId)
            : undefined
        }
        onClose={() => setReceipt(null)}
        onNew={() => {
          setReceipt(null);
          searchRef.current?.focus();
        }}
      />
    </div>
  );
}

export default function PosPage() {
  return (
    <Shell
      title="POS Terminal"
      subtitle="Fast checkout with barcode search, smart attach suggestions, holds & split payments."
    >
      <PosInner />
    </Shell>
  );
}
