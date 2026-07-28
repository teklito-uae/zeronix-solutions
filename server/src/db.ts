import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "zeronix.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Zeronix Technology LLC',
  address TEXT DEFAULT '',
  trn TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo_data_url TEXT DEFAULT '',
  logo_dark_data_url TEXT DEFAULT '',
  default_payment_terms TEXT DEFAULT '',
  default_terms TEXT DEFAULT '',
  default_signatory TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_no TEXT NOT NULL UNIQUE,
  quote_date TEXT NOT NULL,
  due_date TEXT,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL DEFAULT 'Untitled Quote',
  blocks TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  scope TEXT DEFAULT '',
  unit TEXT DEFAULT '1',
  unit_price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const companyColumns = db.prepare("PRAGMA table_info(company)").all() as { name: string }[];
if (!companyColumns.some((c) => c.name === "logo_dark_data_url")) {
  db.exec(`ALTER TABLE company ADD COLUMN logo_dark_data_url TEXT DEFAULT ''`);
}

const companyRow = db.prepare("SELECT id FROM company WHERE id = 1").get();
if (!companyRow) {
  db.prepare(
    `INSERT INTO company (id, name, address, trn, phone, email, default_payment_terms, default_terms, default_signatory)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "Zeronix Technology LLC",
    "#19 Khurram Building, Al-Raffa Street, Bur Dubai",
    "104865090500003",
    "+971 50 981 1669 | +97156 785 0662",
    "info@zeronix.ae | tech@zeronix.ae",
    "60% Advance upon approval of the proposal.\n40% Balance upon successful completion of the project.",
    "",
    "ISMAIL THASRIF KM"
  );
}
