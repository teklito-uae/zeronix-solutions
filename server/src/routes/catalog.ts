import { Router } from "express";
import { db } from "../db.js";

export const catalogRouter = Router();

catalogRouter.get("/", (_req, res) => {
  const rows = db.prepare(`SELECT * FROM catalog_items ORDER BY description ASC`).all();
  res.json(rows);
});

catalogRouter.post("/", (req, res) => {
  const { description, scope, unit, unit_price } = req.body;
  if (!description) return res.status(400).json({ error: "description is required" });
  const info = db
    .prepare(
      `INSERT INTO catalog_items (description, scope, unit, unit_price) VALUES (?, ?, ?, ?)`
    )
    .run(description, scope ?? "", unit ?? "1", unit_price ?? 0);
  const row = db.prepare("SELECT * FROM catalog_items WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

catalogRouter.put("/:id", (req, res) => {
  const { description, scope, unit, unit_price } = req.body;
  db.prepare(
    `UPDATE catalog_items SET description=?, scope=?, unit=?, unit_price=? WHERE id=?`
  ).run(description, scope ?? "", unit ?? "1", unit_price ?? 0, req.params.id);
  const row = db.prepare("SELECT * FROM catalog_items WHERE id = ?").get(req.params.id);
  res.json(row);
});

catalogRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM catalog_items WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
