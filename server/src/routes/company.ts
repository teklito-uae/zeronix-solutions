import { Router } from "express";
import { db } from "../db.js";
import type { Company } from "../types.js";

export const companyRouter = Router();

companyRouter.get("/", (_req, res) => {
  const row = db.prepare("SELECT * FROM company WHERE id = 1").get() as Company;
  res.json(row);
});

companyRouter.put("/", (req, res) => {
  const b = req.body as Partial<Company>;
  db.prepare(
    `UPDATE company SET name=?, address=?, trn=?, phone=?, email=?, logo_data_url=?, logo_dark_data_url=?, default_payment_terms=?, default_terms=?, default_signatory=? WHERE id = 1`
  ).run(
    b.name ?? "",
    b.address ?? "",
    b.trn ?? "",
    b.phone ?? "",
    b.email ?? "",
    b.logo_data_url ?? "",
    b.logo_dark_data_url ?? "",
    b.default_payment_terms ?? "",
    b.default_terms ?? "",
    b.default_signatory ?? ""
  );
  const row = db.prepare("SELECT * FROM company WHERE id = 1").get();
  res.json(row);
});
