import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "./auth.js";

const DATA_DIR = path.resolve(import.meta.dirname, "..", "data");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Plant', 'Industry', 'Auditor')),
  company_name TEXT,
  did TEXT,
  government_license_id TEXT,
  auditor_username TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL REFERENCES users(username),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  issuer TEXT NOT NULL REFERENCES users(username),
  holder TEXT NOT NULL REFERENCES users(username),
  amount INTEGER NOT NULL CHECK (amount > 0),
  retired INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('ISSUE', 'BUY', 'RETIRE')),
  requester TEXT NOT NULL REFERENCES users(username),
  credit_id TEXT REFERENCES credits(id),
  seller TEXT REFERENCES users(username),
  amount INTEGER NOT NULL,
  metadata TEXT,
  anomaly INTEGER NOT NULL DEFAULT 0,
  anomaly_reasons TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by TEXT REFERENCES users(username),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  credit_id TEXT NOT NULL,
  from_user TEXT,
  to_user TEXT,
  amount INTEGER NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
`;

const DEMO_USERS = [
  { username: "auditor", password: "auditor123", role: "Auditor", companyName: "Environmental Audit Corp" },
  { username: "greenplant", password: "plant123", role: "Plant", companyName: "Green H2 Plant", did: "did:hydro:plant1", governmentLicenseId: "GOV-PL-001", auditorUsername: "auditor" },
  { username: "steelco", password: "industry123", role: "Industry", companyName: "SteelCo Industries", did: "did:hydro:industry1", governmentLicenseId: "GOV-IN-001", auditorUsername: "auditor" },
];

export function openDb(file = process.env.DB_FILE ?? path.join(DATA_DIR, "hydrochain.db")) {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  seedDemoUsers(db);
  return db;
}

function seedDemoUsers(db) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, role, company_name, did, government_license_id, auditor_username)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const u of DEMO_USERS) {
    insert.run(u.username, hashPassword(u.password), u.role, u.companyName, u.did ?? null, u.governmentLicenseId ?? null, u.auditorUsername ?? null);
  }
}

export function transaction(db, fn) {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
