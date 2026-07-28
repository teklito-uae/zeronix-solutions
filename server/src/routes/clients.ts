import { Router } from "express";
import { db } from "../db.js";

export const clientsRouter = Router();

clientsRouter.get("/", (req, res) => {
  const q = (req.query.q as string) ?? "";
  const rows = q
    ? db
        .prepare(
          `SELECT * FROM clients WHERE name LIKE ? OR company LIKE ? ORDER BY name ASC`
        )
        .all(`%${q}%`, `%${q}%`)
    : db.prepare(`SELECT * FROM clients ORDER BY name ASC`).all();
  res.json(rows);
});

clientsRouter.post("/", (req, res) => {
  const { name, company, address, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const info = db
    .prepare(
      `INSERT INTO clients (name, company, address, phone, email) VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, company ?? "", address ?? "", phone ?? "", email ?? "");
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

clientsRouter.put("/:id", (req, res) => {
  const { name, company, address, phone, email } = req.body;
  db.prepare(
    `UPDATE clients SET name=?, company=?, address=?, phone=?, email=? WHERE id=?`
  ).run(name, company ?? "", address ?? "", phone ?? "", email ?? "", req.params.id);
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  res.json(row);
});

clientsRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
