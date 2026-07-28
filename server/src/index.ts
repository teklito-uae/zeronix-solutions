import express from "express";
import cors from "cors";
import "./db.js";
import { companyRouter } from "./routes/company.js";
import { clientsRouter } from "./routes/clients.js";
import { catalogRouter } from "./routes/catalog.js";
import { quotesRouter } from "./routes/quotes.js";
import { pdfRouter } from "./routes/pdf.js";

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/company", companyRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/quotes", pdfRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(PORT, () => {
  console.log(`Zeronix Quote Builder API running on http://localhost:${PORT}`);
});
