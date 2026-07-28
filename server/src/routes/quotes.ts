import { Router } from "express";
import { db } from "../db.js";
import { nextQuoteNumber } from "../quoteNumber.js";
import { buildDefaultBlocks } from "../defaultTemplate.js";

export const quotesRouter = Router();

function rowToQuote(row: any) {
  return { ...row, blocks: JSON.parse(row.blocks) };
}

quotesRouter.get("/", (req, res) => {
  const q = (req.query.q as string) ?? "";
  const rows = q
    ? db
        .prepare(
          `SELECT quotes.*, clients.name as client_name FROM quotes
           LEFT JOIN clients ON clients.id = quotes.client_id
           WHERE quotes.title LIKE ? OR quotes.quote_no LIKE ? OR clients.name LIKE ?
           ORDER BY quotes.updated_at DESC`
        )
        .all(`%${q}%`, `%${q}%`, `%${q}%`)
    : db
        .prepare(
          `SELECT quotes.*, clients.name as client_name FROM quotes
           LEFT JOIN clients ON clients.id = quotes.client_id
           ORDER BY quotes.updated_at DESC`
        )
        .all();
  res.json(rows.map(rowToQuote));
});

quotesRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(rowToQuote(row));
});

quotesRouter.post("/", (req, res) => {
  const { title, client_id, fromTemplate } = req.body;
  const quoteNo = nextQuoteNumber();
  const today = new Date().toISOString().slice(0, 10);
  const blocks = fromTemplate === false ? [] : buildDefaultBlocks();
  const info = db
    .prepare(
      `INSERT INTO quotes (quote_no, quote_date, due_date, client_id, status, title, blocks)
       VALUES (?, ?, ?, ?, 'draft', ?, ?)`
    )
    .run(quoteNo, today, null, client_id ?? null, title ?? "Untitled Quote", JSON.stringify(blocks));
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(rowToQuote(row));
});

quotesRouter.put("/:id", (req, res) => {
  const { title, client_id, status, quote_date, due_date, blocks } = req.body;
  const existing = db.prepare("SELECT * FROM quotes WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "not found" });
  db.prepare(
    `UPDATE quotes SET title=?, client_id=?, status=?, quote_date=?, due_date=?, blocks=?, updated_at=datetime('now') WHERE id=?`
  ).run(
    title ?? existing.title,
    client_id ?? existing.client_id,
    status ?? existing.status,
    quote_date ?? existing.quote_date,
    due_date ?? existing.due_date,
    blocks ? JSON.stringify(blocks) : existing.blocks,
    req.params.id
  );
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(req.params.id);
  res.json(rowToQuote(row));
});

quotesRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM quotes WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

quotesRouter.post("/:id/duplicate", (req, res) => {
  const existing = db.prepare("SELECT * FROM quotes WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "not found" });
  const quoteNo = nextQuoteNumber();
  const today = new Date().toISOString().slice(0, 10);
  const info = db
    .prepare(
      `INSERT INTO quotes (quote_no, quote_date, due_date, client_id, status, title, blocks)
       VALUES (?, ?, NULL, ?, 'draft', ?, ?)`
    )
    .run(quoteNo, today, existing.client_id, `${existing.title} (Copy)`, existing.blocks);
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(rowToQuote(row));
});
