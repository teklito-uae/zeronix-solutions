import { db } from "./db.js";

export function nextQuoteNumber(): string {
  const year = new Date().getFullYear();
  const prefix = `ZN-QT-${year}-`;
  const row = db
    .prepare(
      `SELECT quote_no FROM quotes WHERE quote_no LIKE ? ORDER BY id DESC LIMIT 1`
    )
    .get(`${prefix}%`) as { quote_no: string } | undefined;

  let seq = 1;
  if (row) {
    const tail = row.quote_no.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(6, "0")}`;
}
