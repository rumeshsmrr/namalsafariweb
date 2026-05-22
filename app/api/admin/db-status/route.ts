import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { usesEphemeralStorage } from "@/lib/data-path";
import { getPaymentStorageDriver } from "@/lib/payment-storage";
import { apiErrorFromUnknown } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const driver = getPaymentStorageDriver();
    let paymentRequestCount = 0;

    if (driver === "sqlite") {
      const { getDb } = await import("@/lib/db");
      const row = getDb()
        .prepare("SELECT COUNT(*) AS count FROM payment_requests")
        .get() as { count: number };
      paymentRequestCount = row.count;
    } else {
      const { listPaymentRequests } = await import("@/lib/payment-json-store");
      paymentRequestCount = listPaymentRequests().length;
    }

    return NextResponse.json({
      ok: true,
      driver: `payments:${driver}`,
      ephemeral: usesEphemeralStorage(),
      paymentRequestCount,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ephemeral: usesEphemeralStorage(),
        ...apiErrorFromUnknown(err),
      },
      { status: 500 },
    );
  }
}
