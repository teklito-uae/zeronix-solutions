import type { PriceRow } from "./types";

export function computeTotals(rows: PriceRow[], vatPercent: number) {
  const subtotal = rows.reduce((sum, r) => sum + r.unit * r.unitPrice, 0);
  const vat = subtotal * (vatPercent / 100);
  const grandTotal = subtotal + vat;
  return { subtotal, vat, grandTotal };
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
