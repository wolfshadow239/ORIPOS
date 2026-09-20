
import { PRODUCTS } from './products';
import { STORES } from './stores';
import { Customer, Order, OrderItem } from './types';
import { computeTotals } from './compute';

export const DAYS = 150;

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];

function wpick(r: () => number, values: number[], weights: number[]): number {
  const tot = weights.reduce((a, b) => a + b, 0);
  let x = r() * tot;
  for (let i = 0; i < values.length; i++) {
    x -= weights[i];
    if (x <= 0) return values[i];
  }
  return values[values.length - 1];
}

function wpickStr(r: () => number, values: string[], weights: number[]): string {
  const tot = weights.reduce((a, b) => a + b, 0);
  let x = r() * tot;
  for (let i = 0; i < values.length; i++) {
    x -= weights[i];
    if (x <= 0) return values[i];
  }
  return values[values.length - 1];
}

const FIRST = [
  'Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya', 'Karan', 'Pooja', 'Arjun', 'Ishita',
  'Rahul', 'Meera', 'Aditya', 'Kavya', 'Nikhil', 'Divya', 'Sahil', 'Tanvi', 'Manish', 'Riya',
  'Kunal', 'Shreya', 'Amit', 'Neha', 'Varun', 'Simran', 'Harsh', 'Ankita', 'Yash', 'Swati',
  'Gaurav', 'Madhuri', 'Tejas', 'Pallavi', 'Siddharth', 'Aishwarya', 'Naveen', 'Bhavna', 'Rajesh', 'Sonal',
  'Deepak', 'Komal', 'Vivek', 'Rachana', 'Sandeep', 'Amruta', 'Onkar', 'Mrunal', 'Shubham', 'Vaibhav',
];
const LAST = [
  'Sharma', 'Patel', 'Nair', 'Kulkarni', 'Mehta', 'Shah', 'Desai', 'Joshi', 'Khan', 'Reddy',
  'Iyer', 'Bose', 'Chauhan', 'Malhotra', 'Bhatia', 'Saxena', 'Verma', 'Pillai', 'Das', 'Trivedi',
  'Rao', 'Chopra', 'Agarwal', 'Mukherjee', 'Sinha', 'Thakur', 'Rathod', 'More', 'Jadhav', 'Bhosale',
  'Gaikwad', 'Kadam', 'Sawant', 'Deshpande', 'Kale', 'Pawar', 'Chavan', 'Shinde', 'Godse', 'Manjrekar',
];
const CASHIERS = ['Rohan Kale', 'Sneha Patil', 'Amit Verma', 'Pooja Das', 'Vikram Rao', 'Neha Kulkarni'];

const CATS = ['Smartphones', 'Tablets', 'Wearables', 'Audio', 'TVs', 'Home Appliances', 'Laptops', 'Accessories'];
const STD_W = [0.34, 0.10, 0.11, 0.12, 0.12, 0.09, 0.04, 0.08];
const SC_W = [0.16, 0.03, 0.10, 0.14, 0.02, 0.02, 0.0, 0.53];

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const HOUR_W = [2, 3, 4, 5, 6, 7, 7, 8, 10, 12, 10, 6];

const byCat: Record<string, typeof PRODUCTS> = {};
for (const c of CATS) byCat[c] = PRODUCTS.filter(p => p.category === c);

export function orderId(storeId: string, n: number): string {
  return 'OR-' + storeId.toUpperCase() + '-' + String(n).padStart(5, '0');
}

export interface Seed {
  orders: Order[];
  customers: Customer[];
  stock: Record<string, Record<string, number>>;
  countByStore: Record<string, number>;
  pairs: Record<string, [string, number][]>;
}

export function buildSeed(): Seed {
  const r = mulberry32(20240914);

  const customers: Customer[] = [];
  for (let i = 0; i < 480; i++) {
    const store = STORES[Math.floor(r() * STORES.length)];
    const name = pick(r, FIRST) + ' ' + pick(r, LAST);
    customers.push({
      id: 'C' + (1000 + i),
      name,
      phone: '+91 9' + String(Math.floor(r() * 900000000) + 100000000),
      email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@gmail.com',
      points: Math.floor(r() * 900),
      storeId: store.id,
      createdAt: Date.now() - Math.floor(r() * DAYS) * 86400000,
    });
  }

  const orders: Order[] = [];
  const countByStore: Record<string, number> = {};
  const sold: Record<string, Record<string, number>> = {};
  const pairCount: Record<string, Record<string, number>> = {};
  const now = new Date();
  now.setHours(23, 59, 0, 0);

  for (const store of STORES) {
    countByStore[store.id] = 0;
    sold[store.id] = {};
    const catW = store.id === 'viman-sc' ? SC_W : STD_W;

    for (let d = DAYS - 1; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      const dow = day.getDay();
      const wk = dow === 0 || dow === 6 ? 1.42 : 1;
      const festive = d < 46 && d > 28 ? 1.28 : 1; // festive season window
      const cnt = Math.round((11 + r() * 7) * store.size * wk * festive);

      for (let k = 0; k < cnt; k++) {
        const hour = wpick(r, HOURS, HOUR_W);
        const dt = new Date(day);
        dt.setHours(hour, Math.floor(r() * 60), 0, 0);

        const nItems = r() < 0.52 ? 1 : r() < 0.8 ? 2 : r() < 0.95 ? 3 : 4;
        const items: OrderItem[] = [];
        for (let j = 0; j < nItems; j++) {
          const cat = wpickStr(r, CATS, catW);
          const p = pick(r, byCat[cat]);
          const qty = r() < 0.12 && p.price < 30000 ? 1 + Math.floor(r() * 2) : 1;
          const disc = r() < 0.06 ? Math.round(p.price * (0.05 + r() * 0.1)) : 0;
          items.push({ productId: p.id, name: p.name, price: p.price, qty, discount: disc, gst: p.gst });
        }

        const odPct = r() < 0.08 ? Math.round(5 + r() * 8) : 0;
        const t = computeTotals(items, odPct);
        const m = r();
        const method = m < 0.45 ? 'upi' : m < 0.75 ? 'card' : m < 0.95 ? 'cash' : 'credit';
        const cust = r() < 0.72 ? customers[Math.floor(r() * customers.length)] : null;

        countByStore[store.id]++;
        orders.push({
          id: orderId(store.id, countByStore[store.id]),
          storeId: store.id,
          items,
          subtotal: t.subtotal,
          discount: t.orderDiscountAmt,
          tax: t.tax,
          total: t.total,
          payments: [{ method, amount: t.total }],
          customerId: cust ? cust.id : undefined,
          cashier: pick(r, CASHIERS),
          status: 'completed',
          createdAt: dt.getTime(),
          orderDiscountPct: odPct,
        });

        const ids = items.map(i => i.productId);
        for (const i of items) {
          sold[store.id][i.productId] = (sold[store.id][i.productId] || 0) + i.qty;
          pairCount[i.productId] = pairCount[i.productId] || {};
          for (const other of ids) {
            if (other !== i.productId) pairCount[i.productId][other] = (pairCount[i.productId][other] || 0) + 1;
          }
        }
      }
    }
  }

  orders.sort((a, b) => a.createdAt - b.createdAt);

  const pairs: Record<string, [string, number][]> = {};
  for (const pid of Object.keys(pairCount)) {
    pairs[pid] = Object.entries(pairCount[pid]).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }

  const stock: Record<string, Record<string, number>> = {};
  for (const s of STORES) {
    stock[s.id] = {};
    for (const p of PRODUCTS) {
      const base = 16 + Math.floor(r() * 42);
      stock[s.id][p.id] = Math.max(0, base - (sold[s.id][p.id] || 0));
    }
  }

  return { orders, customers, stock, countByStore, pairs };
}
