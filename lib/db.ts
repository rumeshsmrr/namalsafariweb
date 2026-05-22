import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/**
 * Lazy SQLite singleton.
 *
 * We intentionally DO NOT open the connection at module import time. Next.js
 * executes route modules during `next build` (the "collect page data" step)
 * with multiple worker processes — if every worker opened the DB file in
 * WAL mode simultaneously, they would collide (SQLITE_BUSY).
 *
 * Instead, `getDb()` opens the connection on first real use (i.e. at request
 * time), which guarantees only the running server process holds it.
 *
 * Production DB location is controlled by DATABASE_PATH so it can live
 * outside the repo (e.g. /var/lib/nimalsafari/data/app.db on the VPS).
 */

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "app.db");

/** Vercel serverless only allows writes under /tmp — repo `data/` is read-only. */
const VERCEL_DB_PATH = path.join("/tmp", "nimalsafari-app.db");

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH?.trim()) {
    return process.env.DATABASE_PATH.trim();
  }
  if (process.env.VERCEL) {
    return VERCEL_DB_PATH;
  }
  return DEFAULT_DB_PATH;
}

/** True when the DB file is not durable across deploys/instances (e.g. Vercel /tmp). */
export function usesEphemeralDatabase(): boolean {
  return Boolean(process.env.VERCEL) && !process.env.DATABASE_PATH?.trim();
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initialize(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id              TEXT PRIMARY KEY,
      short_ref       TEXT NOT NULL UNIQUE,
      token           TEXT NOT NULL UNIQUE,
      customer_name   TEXT NOT NULL,
      email           TEXT,
      phone           TEXT,
      package_name    TEXT,
      park            TEXT,
      safari_type     TEXT,
      time_slot       TEXT,
      meal_plan       TEXT,
      meal_preference TEXT,
      safari_date     TEXT,
      guests          INTEGER,
      notes           TEXT,
      amount          INTEGER NOT NULL,
      currency        TEXT NOT NULL DEFAULT 'LKR',
      status          TEXT NOT NULL DEFAULT 'PENDING',
      expires_at      TEXT NOT NULL,
      created_at      TEXT NOT NULL,
      created_by      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_payment_requests_status
      ON payment_requests(status);
    CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at
      ON payment_requests(created_at DESC);

    CREATE TABLE IF NOT EXISTS payments (
      id                  TEXT PRIMARY KEY,
      payment_request_id  TEXT NOT NULL,
      gateway             TEXT NOT NULL DEFAULT 'onepay',
      transaction_id      TEXT NOT NULL UNIQUE,
      status              TEXT NOT NULL,
      amount              INTEGER NOT NULL,
      currency            TEXT NOT NULL,
      paid_at             TEXT NOT NULL,
      raw_response        TEXT NOT NULL,
      FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id)
    );

    CREATE INDEX IF NOT EXISTS idx_payments_request
      ON payments(payment_request_id);
  `);

  // Idempotent column additions for existing DBs created before these
  // columns were introduced. Safe to re-run on every startup.
  const cols = db
    .prepare("PRAGMA table_info(payment_requests)")
    .all() as { name: string }[];
  const hasCol = (n: string) => cols.some((c) => c.name === n);
  if (!hasCol("time_slot")) {
    db.exec("ALTER TABLE payment_requests ADD COLUMN time_slot TEXT");
  }
  if (!hasCol("meal_preference")) {
    db.exec("ALTER TABLE payment_requests ADD COLUMN meal_preference TEXT");
  }
  if (!hasCol("park")) {
    db.exec("ALTER TABLE payment_requests ADD COLUMN park TEXT");
  }
  if (!hasCol("safari_type")) {
    db.exec("ALTER TABLE payment_requests ADD COLUMN safari_type TEXT");
  }
  if (!hasCol("meal_plan")) {
    db.exec("ALTER TABLE payment_requests ADD COLUMN meal_plan TEXT");
  }
  if (!hasCol("short_ref")) {
    db.exec("ALTER TABLE payment_requests ADD COLUMN short_ref TEXT");
    db.exec(
      "UPDATE payment_requests SET short_ref = SUBSTR(REPLACE(id,'-',''),1,21) WHERE short_ref IS NULL",
    );
    db.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_requests_short_ref ON payment_requests(short_ref)",
    );
  }
}

type GlobalWithDb = typeof globalThis & { __nimalDb?: Database.Database };
const g = globalThis as GlobalWithDb;

export function getDb(): Database.Database {
  if (g.__nimalDb) return g.__nimalDb;
  const dbPath = resolveDbPath();
  ensureDir(dbPath);
  const db = new Database(dbPath);
  initialize(db);
  g.__nimalDb = db;
  return db;
}
