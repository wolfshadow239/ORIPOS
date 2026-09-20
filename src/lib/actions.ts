
import { loadDB, saveDB, getSeed } from './db';
import { Order, OrderItem, Payment, Customer, User, Role } from './types';
import { computeTotals } from './compute';

let refreshFn: (() => void) | null = null;
export function registerRefresh(fn: () => void): void {
  refreshFn = fn;
}
function commit(): void {
  saveDB();
  if (refreshFn) refreshFn();
}

export interface CheckoutArgs {
  storeId: string;
  items: OrderItem[];
  orderDiscountPct: number;
  payments: Payment[];
  customerId?: string;
  cashier: string;
}

export function checkout(args: CheckoutArgs): Order {
  const db = loadDB();
  const t = computeTotals(args.items, args.orderDiscountPct);
  const seq =
    (getSeed().countByStore[args.storeId] || 0) +
    db.orders.filter(o => o.storeId === args.storeId).length +
    1;
  const order: Order = {
    id: 'OR-' + args.storeId.toUpperCase() + '-' + String(seq).padStart(5, '0'),
    storeId: args.storeId,
    items: args.items,
    subtotal: t.subtotal,
    discount: t.orderDiscountAmt,
    tax: t.tax,
    total: t.total,
    payments: args.payments,
    customerId: args.customerId,
    cashier: args.cashier,
    status: 'completed',
    createdAt: Date.now(),
    orderDiscountPct: args.orderDiscountPct,
  };
  for (const it of args.items) {
    const cur = db.stock[args.storeId]?.[it.productId] ?? 0;
    db.stock[args.storeId][it.productId] = Math.max(0, cur - it.qty);
  }
  if (args.customerId) {
    const c = db.customers.find(x => x.id === args.customerId);
    if (c) c.points += Math.floor(t.total / 100);
  }
  db.orders.push(order);
  commit();
  return order;
}

export function holdOrder(draft: Omit<Order, 'id' | 'status'>): Order {
  const db = loadDB();
  const held: Order = {
    ...draft,
    id: 'HLD-' + Date.now().toString(36).toUpperCase(),
    status: 'held',
  };
  db.held.push(held);
  commit();
  return held;
}

export function resumeHeld(id: string): Order | null {
  const db = loadDB();
  const i = db.held.findIndex(h => h.id === id);
  if (i < 0) return null;
  const [h] = db.held.splice(i, 1);
  commit();
  return h;
}

export function deleteHeld(id: string): void {
  const db = loadDB();
  db.held = db.held.filter(h => h.id !== id);
  commit();
}

export function refundOrder(orderId: string): void {
  const db = loadDB();
  const o =
    db.orders.find(x => x.id === orderId) || getSeed().orders.find(x => x.id === orderId);
  if (!o || o.status === 'refunded') return;
  const live = db.orders.find(x => x.id === orderId);
  if (live) live.status = 'refunded';
  db.refundedIds.push(orderId);
  for (const it of o.items) {
    const cur = db.stock[o.storeId]?.[it.productId] ?? 0;
    db.stock[o.storeId][it.productId] = cur + it.qty;
  }
  if (o.customerId) {
    const c = db.customers.find(x => x.id === o.customerId);
    if (c) c.points = Math.max(0, c.points - Math.floor(o.total / 100));
  }
  commit();
}

export function adjustStock(productId: string, storeId: string, delta: number, reason: string): void {
  const db = loadDB();
  db.stock[storeId] = db.stock[storeId] || {};
  db.stock[storeId][productId] = Math.max(0, (db.stock[storeId][productId] ?? 0) + delta);
  db.adjustments.push({ productId, storeId, delta, reason, at: Date.now() });
  commit();
}

export function addCustomer(name: string, phone: string, storeId: string): Customer {
  const db = loadDB();
  const c: Customer = {
    id: 'C' + (2000 + db.customers.length),
    name,
    phone,
    email: '',
    points: 0,
    storeId,
    createdAt: Date.now(),
  };
  db.customers.push(c);
  commit();
  return c;
}

export function addUser(name: string, role: Role, storeId: string | null, pin: string): User {
  const db = loadDB();
  const u: User = { id: 'u-' + Date.now().toString(36), name, role, storeId, pin };
  db.users.push(u);
  commit();
  return u;
}

export function updateSettings(patch: Partial<import('./db').Settings>): void {
  const db = loadDB();
  db.settings = { ...db.settings, ...patch };
  commit();
}
