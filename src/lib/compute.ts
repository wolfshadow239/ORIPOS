
import { OrderItem } from './types';

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface Totals {
  subtotal: number;
  itemDiscounts: number;
  orderDiscountAmt: number;
  tax: number;
  total: number;
}

export function computeTotals(items: OrderItem[], orderDiscountPct: number): Totals {
  const gross = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemDisc = items.reduce((s, i) => s + (i.discount || 0) * i.qty, 0);
  const taxable = Math.max(0, gross - itemDisc);
  const orderDiscountAmt = round2((taxable * orderDiscountPct) / 100);
  const afterOrder = taxable - orderDiscountAmt;
  const factor = taxable > 0 ? afterOrder / taxable : 0;
  let tax = 0;
  for (const i of items) {
    const line = (i.price * i.qty - (i.discount || 0) * i.qty) * factor;
    tax += (line * i.gst) / 100;
  }
  tax = round2(tax);
  return {
    subtotal: round2(gross),
    itemDiscounts: round2(itemDisc),
    orderDiscountAmt,
    tax,
    total: round2(afterOrder + tax),
  };
}
