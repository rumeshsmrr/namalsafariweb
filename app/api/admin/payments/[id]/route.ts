import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getPaymentRequestById,
  deletePaymentRequest,
} from "@/lib/payment-storage";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
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

  deletePaymentRequest(id);
  return NextResponse.json({ success: true });
}
