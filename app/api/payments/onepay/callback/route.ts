import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentRequestByShortRef,
  recordPaymentAndSetStatus,
} from "@/lib/payment-storage";
import {
  mapOnePayStatus,
  verifyOnePayCallbackToken,
  verifyWebhookSignature,
  type OnePayWebhookPayload,
} from "@/lib/onepay";
import { sendBookingConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * OnePay server-to-server webhook (portal "Callback URL").
 *
 * Supports:
 * 1) Signed payloads (signature + ipg_transaction_id + …) per older IPG flows.
 * 2) Docs-style JSON + portal Callback Token (ONEPAY_CALLBACK_TOKEN), when set.
 *
 * Docs sample omits `reference`; real callbacks may still include it. If there
 * is no reference we cannot match a payment_request — we return 200 to avoid
 * infinite retries and log a warning.
 */
export async function POST(request: NextRequest) {
  console.log("[webhook] ← callback received from OnePay");

  let payload: OnePayWebhookPayload;
  try {
    payload = (await request.json()) as OnePayWebhookPayload;
  } catch {
    console.error("[webhook] invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(
    `[webhook] payload  ref="${payload.reference ?? ""}"  status="${payload.status ?? ""}"  txn="${payload.ipg_transaction_id ?? payload.transaction_id ?? ""}"`,
  );

  const signedOk = verifyWebhookSignature(payload);
  const tokenOk = verifyOnePayCallbackToken(request, payload);

  if (!signedOk && !tokenOk) {
    console.warn(
      "[webhook] ✗ unauthorized — no valid signature or callback token",
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log(`[webhook] auth ok  signed=${signedOk}  token=${tokenOk}`);

  const reference = String(payload.reference ?? "").trim();
  if (!reference) {
    console.warn(
      "[webhook] missing reference — cannot match payment request",
      payload,
    );
    return NextResponse.json({ ok: true });
  }

  const pr = getPaymentRequestByShortRef(reference);
  if (!pr) {
    console.warn("[webhook] unknown short_ref:", reference);
    return NextResponse.json({ error: "Unknown reference" }, { status: 404 });
  }

  console.log(
    `[webhook] matched payment request  ref=${reference}  customer="${pr.customerName}"`,
  );

  const gatewayStatus = mapOnePayStatus(
    payload.status,
    payload.status_message,
  );

  console.log(`[webhook] gateway status → ${gatewayStatus}`);

  const txnId = String(
    payload.ipg_transaction_id ?? payload.transaction_id ?? "",
  ).trim();
  if (!txnId) {
    console.error("[webhook] missing transaction id");
    return NextResponse.json(
      { error: "Missing transaction id" },
      { status: 400 },
    );
  }

  let amountMajor: number;
  if (payload.amount != null && String(payload.amount).trim() !== "") {
    amountMajor = Number(payload.amount);
  } else {
    amountMajor = pr.amount / 100;
  }

  if (
    gatewayStatus === "SUCCESS" &&
    Math.abs(amountMajor - pr.amount / 100) > 0.01
  ) {
    console.error(
      `[webhook] ✗ amount mismatch  ref=${reference}  received=${amountMajor}  expected=${pr.amount / 100}`,
    );
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  try {
    const { recorded } = recordPaymentAndSetStatus({
      paymentRequestId: pr.id,
      transactionId: txnId,
      status: gatewayStatus,
      amount: Math.round(amountMajor * 100),
      currency: pr.currency,
      rawResponse: JSON.stringify(payload),
    });
    if (recorded) {
      console.log(
        `[webhook] ✓ payment recorded  ref=${reference}  txn=${txnId}  status=${gatewayStatus}`,
      );

      // Send confirmation email on successful payment (fire-and-forget —
      // a failed email must never cause a non-200 webhook response).
      if (gatewayStatus === "SUCCESS") {
        sendBookingConfirmation({
          pr,
          transactionId: txnId,
          paidAt: new Date().toISOString(),
        }).catch((err) => {
          console.error("[webhook] confirmation email error:", err);
        });
      }
    } else {
      console.log(
        `[webhook] duplicate webhook ignored  ref=${reference}  txn=${txnId}`,
      );
    }
  } catch (err) {
    console.error("[webhook] ✗ failed to record payment:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
