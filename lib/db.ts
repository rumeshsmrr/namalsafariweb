import path from "path";
import fs from "fs";
import type BetterSqlite3 from "better-sqlite3";

/**
 * Lazy SQLite singleton.
 *
 * Local / VPS: better-sqlite3 (file under data/ or DATABASE_PATH).
 * Vercel: Node 22 built-in node:sqlite (no native .node binary — better-sqlite3
 * often fails with "Module did not self-register" on serverless).
 */

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "app.db");
const VERCEL_DB_PATH = path.join("/tmp", "nimalsafari-app.db");

export type SqliteStatement = {
  run: (...params: unknown[]) => unknown;
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
};

export type AppSqliteDatabase = {
  exec: (sql: string) => void;
  pragma: (pragma: string) => void;
  prepare: (sql: string) => SqliteStatement;
  transaction: (fn: () => void) => () => void;
};

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH?.trim()) {
    return process.env.DATABASE_PATH.trim();
  }
  if (process.env.VERCEL) {
    return VERCEL_DB_PATH;
  }
  return DEFAULT_DB_PATH;
}

export function usesEphemeralDatabase(): boolean {
  return Boolean(process.env.VERCEL) && !process.env.DATABASE_PATH?.trim();
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function wrapBetter(db: BetterSqlite3.Database): AppSqliteDatabase {
  return {
    exec: (sql) => {
      db.exec(sql);
    },
    pragma: (p) => {
      db.pragma(p);
    },
    prepare: (sql) => db.prepare(sql) as SqliteStatement,
    transaction: (fn) => db.transaction(fn),
  };
}

/** Node 22+ built-in sqlite (used on Vercel). */
type NodeSqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...params: unknown[]) => unknown;
    get: (...params: unknown[]) => unknown;
    all: (...params: unknown[]) => unknown[];
  };
};

function wrapNode(db: NodeSqliteDatabase): AppSqliteDatabase {
  return {
    exec: (sql) => {
      db.exec(sql);
    },
    pragma: (p) => {
      db.exec(`PRAGMA ${p}`);
    },
    prepare: (sql) => {
      const stmt = db.prepare(sql);
      return {
        run: (...params: unknown[]) => stmt.run(...params),
        get: (...params: unknown[]) => stmt.get(...params),
        all: (...params: unknown[]) => stmt.all(...params) as unknown[],
      };
    },
    transaction: (fn) => () => {
      db.exec("BEGIN IMMEDIATE");
      try {
        fn();
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    },
  };
}

function openDatabase(dbPath: string): AppSqliteDatabase {
  if (process.env.VERCEL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DatabaseSync } = require("node:sqlite") as {
        DatabaseSync: new (path: string) => NodeSqliteDatabase;
      };
      return wrapNode(new DatabaseSync(dbPath));
    } catch (err) {
      console.warn(
        "[db] node:sqlite unavailable; ensure Node 22 on Vercel. Falling back to better-sqlite3.",
        err,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as {
    new (path: string): BetterSqlite3.Database;
  };
  return wrapBetter(new Database(dbPath));
}

function initialize(db: AppSqliteDatabase) {
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

type GlobalWithDb = typeof globalThis & { __nimalDb?: AppSqliteDatabase };
const g = globalThis as GlobalWithDb;

export function getDb(): AppSqliteDatabase {
  if (g.__nimalDb) return g.__nimalDb;
  const dbPath = resolveDbPath();
  ensureDir(dbPath);
  const db = openDatabase(dbPath);
  initialize(db);
  g.__nimalDb = db;
  return db;
}

/** @deprecated Use AppSqliteDatabase — kept for any external imports */
export type Database = AppSqliteDatabase;
