import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentRequestByToken,
  refreshExpiryIfNeeded,
} from "@/lib/payment-storage";
import { createCheckoutLink } from "@/lib/onepay";
import { normalizeSriLankanPhone } from "@/lib/phone";
import { apiErrorFromUnknown } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/** OnePay rejects empty / invalid email (official PHP SDK validates like PHP filter_var). */
const LOOSE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** E.164 per OnePay docs, e.g. +94771234567 */
function contactForOnePay(pr: { email: string | null; phone: string | null }) {
  const rawEmail = pr.email?.trim() ?? "";
  const email =
    rawEmail && LOOSE_EMAIL.test(rawEmail)
      ? rawEmail
      : (process.env.ONEPAY_PLACEHOLDER_EMAIL?.trim() ??
        "bookings@nimalsafari.com");

  const phone =
    normalizeSriLankanPhone(pr.phone ?? "") ??
    normalizeSriLankanPhone(process.env.ONEPAY_PLACEHOLDER_PHONE ?? "") ??
    "+94767627295";

  return { email, phone };
}

/**
 * Customer-initiated: build an OnePay checkout link for a pending request
 * and return the redirect URL. The amount is always read from the DB, never
 * from the request body — the client cannot influence it.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const raw = getPaymentRequestByToken(token);
  if (!raw) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pr = refreshExpiryIfNeeded(raw);
  if (pr.status !== "PENDING" && pr.status !== "FAILED") {
    console.warn(
      `[initiate] blocked — link ${pr.shortRef} is already ${pr.status}`,
    );
    return NextResponse.json(
      { error: `This payment link is ${pr.status.toLowerCase()}.` },
      { status: 409 },
    );
  }

  // Split name into first/last as OnePay requires both.
  const parts = pr.customerName.trim().split(/\s+/);
  const firstName = parts[0] ?? "Customer";
  const lastName = parts.slice(1).join(" ") || "-";

  const { email, phone } = contactForOnePay(pr);

  const origin =
    process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin;
  const redirectUrl = `${origin}/pay/${pr.token}/status`;

  console.log(
    `[initiate] starting payment  ref=${pr.shortRef}  customer="${pr.customerName}"  amount=${pr.amount / 100} ${pr.currency}`,
  );

  try {
    const notifyUrl = `${origin}/api/payments/onepay/callback`;

    const checkout = await createCheckoutLink({
      reference: pr.shortRef,  // OnePay max 21 chars
      amountMinor: pr.amount,
      currency: pr.currency,
      customer: {
        firstName,
        lastName,
        phone,
        email,
      },
      redirectUrl,
      notifyUrl,
      additionalData: pr.packageName ?? undefined,
    });

    console.log(
      `[initiate] ✓ redirect ready  ref=${pr.shortRef}  ipgTxn=${checkout.ipgTransactionId}`,
    );

    return NextResponse.json({
      redirectUrl: checkout.redirectUrl,
      ipgTransactionId: checkout.ipgTransactionId,
    });
  } catch (err) {
    console.error(`[initiate] ✗ failed  ref=${pr.shortRef}`, err);
    return NextResponse.json(apiErrorFromUnknown(err), { status: 502 });
  }
}
