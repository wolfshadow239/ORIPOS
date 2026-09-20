
import { Order, OrderStatus, Customer, User, Product } from './types';
import { PRODUCTS } from './products';
import { STORES } from './stores';
import { buildSeed, Seed } from './seed';

export interface Settings {
  gstin: string;
  receiptFooter: string;
  lowStockDays: number;
}

export interface Adjustment {
  productId: string;
  storeId: string;
  delta: number;
  reason: string;
  at: number;
}

export interface DB {
  version: number;
  orders: Order[];
  held: Order[];
  customers: Customer[];
  stock: Record<string, Record<string, number>>;
  users: User[];
  adjustments: Adjustment[];
  refundedIds: string[];
  settings: Settings;
}

const KEY = 'orison_pos_v1';

const DEFAULT_USERS: User[] = [
  { id: 'u-admin', name: 'Aarav Mehta', role: 'admin', storeId: null, pin: 'orison123' },
  { id: 'u-mgr', name: 'Priya Nair', role: 'manager', storeId: 'amanora', pin: 'orison123' },
  { id: 'u-cash', name: 'Rohan Kale', role: 'cashier', storeId: 'amanora', pin: 'orison123' },
];

// Cache lives only in the browser; on the server each render gets a fresh seed.
let cache: DB | null = null;
let seedCache: Seed | null = null;

export function getSeed(): Seed {
  if (!seedCache) seedCache = buildSeed();
  return seedCache;
}

export function loadDB(): DB {
  // On SSR there is no localStorage; never persist server-side.
  if (typeof window === 'undefined') {
    const seed = getSeed();
    return {
      version: 1, orders: [], held: [], customers: seed.customers,
      stock: seed.stock, users: DEFAULT_USERS, adjustments: [],
      refundedIds: [],
      settings: { gstin: '27AABCO1234F1Z5', receiptFooter: 'Thank you for shopping at Orison Retail — Samsung Experience Store. GST invoice included. 7-day replacement on accessories.', lowStockDays: 10 },
    };
  }
  if (cache) return cache;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache!;
    }
  } catch {
    /* ignore */
  }
  const seed = getSeed();
  cache = {
    version: 1,
    orders: [],
    held: [],
    customers: seed.customers,
    stock: seed.stock,
    users: DEFAULT_USERS,
    adjustments: [],
    refundedIds: [],
    settings: {
      gstin: '27AABCO1234F1Z5',
      receiptFooter: 'Thank you for shopping at Orison Retail — Samsung Experience Store. GST invoice included. 7-day replacement on accessories.',
      lowStockDays: 10,
    },
  };
  saveDB();
  return cache!;
}

export function saveDB(): void {
  try {
    if (typeof window !== 'undefined' && cache) window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function resetDB(): void {
  cache = null;
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  loadDB();
}

export function allOrders(): Order[] {
  const db = loadDB();
  const refunded = new Set(db.refundedIds);
  return getSeed()
    .orders.map(o => (refunded.has(o.id) ? { ...o, status: 'refunded' as OrderStatus } : o))
    .concat(db.orders);
}

export interface AllData {
  db: DB;
  seed: Seed;
  orders: Order[];
  stock: DB['stock'];
  customers: Customer[];
  users: User[];
  settings: Settings;
  products: Product[];
  stores: typeof STORES;
}

export function buildAll(): AllData {
  const db = loadDB();
  return {
    db,
    seed: getSeed(),
    orders: allOrders(),
    stock: db.stock,
    customers: db.customers,
    users: db.users,
    settings: db.settings,
    products: PRODUCTS,
    stores: STORES,
  };
}
