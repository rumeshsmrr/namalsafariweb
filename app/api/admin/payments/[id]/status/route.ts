import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getPaymentRequestById,
  updatePaymentRequestStatus,
  recordPaymentAndSetStatus,
  type PaymentStatus,
} from "@/lib/payment-storage";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES: PaymentStatus[] = ["PAID", "FAILED", "PENDING", "EXPIRED"];

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const pr = getPaymentRequestById(id);
  if (!pr) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
  };

  const newStatus = body.status as PaymentStatus | undefined;
  if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  if (newStatus === "PAID") {
    // Record a manual payment entry so transaction history is populated.
    recordPaymentAndSetStatus({
      paymentRequestId: pr.id,
      transactionId: `manual-${Date.now()}`,
      status: "SUCCESS",
      amount: pr.amount,
      currency: pr.currency,
      rawResponse: JSON.stringify({ manual: true, by: session.user?.email ?? "admin" }),
    });
  } else {
    updatePaymentRequestStatus(pr.id, newStatus);
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
