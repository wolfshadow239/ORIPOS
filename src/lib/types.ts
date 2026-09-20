
export type Role = 'admin' | 'manager' | 'cashier';
export type PayMethod = 'cash' | 'card' | 'upi' | 'credit';
export type OrderStatus = 'completed' | 'held' | 'refunded';

export interface User {
  id: string;
  name: string;
  role: Role;
  storeId: string | null;
  pin: string;
}

export interface Store {
  id: string;
  name: string;
  short: string;
  area: string;
  city: string;
  phone: string;
  size: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  gst: number;
  emoji: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  discount: number;
  gst: number;
}

export interface Payment {
  method: PayMethod;
  amount: number;
}

export interface Order {
  id: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: Payment[];
  customerId?: string;
  cashier: string;
  status: OrderStatus;
  createdAt: number;
  orderDiscountPct?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  storeId: string;
  createdAt: number;
}
