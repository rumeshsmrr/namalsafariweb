import { usesEphemeralDatabase } from "@/lib/db";

/** Safe, admin-facing message for SQLite / filesystem failures. */
export function formatDatabaseError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (
    lower.includes("eroofs") ||
    lower.includes("read-only") ||
    lower.includes("eacces") ||
    lower.includes("cannot open database")
  ) {
    if (usesEphemeralDatabase() || process.env.VERCEL) {
      return (
        "Database could not be written on this server. Vercel only allows SQLite in /tmp " +
        "(data is not shared across instances). For production payments, deploy to your VPS " +
        "with DATABASE_PATH set to a persistent folder, or use a hosted database."
      );
    }
    return (
      "Database could not be written. Set DATABASE_PATH to a writable directory on the server."
    );
  }

  if (lower.includes("bindings") || lower.includes("better_sqlite3")) {
    return (
      "SQLite native module failed to load on this host. Redeploy on a Node server (VPS) " +
      "rather than serverless, or contact support."
    );
  }

  if (usesEphemeralDatabase()) {
    return `Database error (ephemeral serverless storage): ${msg}`;
  }

  return msg || "Database error";
}
