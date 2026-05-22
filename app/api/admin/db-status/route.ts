import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, usesEphemeralDatabase } from "@/lib/db";
import { apiErrorFromUnknown } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const row = db
      .prepare("SELECT COUNT(*) AS count FROM payment_requests")
      .get() as { count: number };

    return NextResponse.json({
      ok: true,
      driver: process.env.VERCEL ? "node:sqlite (Vercel)" : "better-sqlite3",
      ephemeral: usesEphemeralDatabase(),
      paymentRequestCount: row.count,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ephemeral: usesEphemeralDatabase(),
        ...apiErrorFromUnknown(err),
      },
      { status: 500 },
    );
  }
}
