import { NextResponse } from "next/server";
import {
  getPaymentRequestByToken,
  refreshExpiryIfNeeded,
} from "@/lib/payment-storage";

export const dynamic = "force-dynamic";

/**
 * Public read endpoint used by the customer payment page to refresh status.
 * Returns only the fields the customer needs — no admin metadata.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const raw = getPaymentRequestByToken(token);
  if (!raw) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pr = refreshExpiryIfNeeded(raw);

  return NextResponse.json({
    token: pr.token,
    customerName: pr.customerName,
    packageName: pr.packageName,
    park: pr.park,
    safariType: pr.safariType,
    timeSlot: pr.timeSlot,
    mealPreference: pr.mealPreference,
    safariDate: pr.safariDate,
    guests: pr.guests,
    notes: pr.notes,
    amount: pr.amount,
    currency: pr.currency,
    status: pr.status,
    expiresAt: pr.expiresAt,
  });
}
