import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createPaymentRequest,
  listPaymentRequestsPaginated,
  PARKS,
  SAFARI_TYPES,
  TIME_SLOTS,
  MEAL_PREFERENCES,
  type Park,
  type SafariType,
  type TimeSlot,
  type MealPreference,
  type PaymentStatus,
} from "@/lib/payment-storage";
import {
  normalizeSriLankanPhone,
  SRI_LANKA_PHONE_FORMAT_ERROR,
} from "@/lib/phone";
import { formatDatabaseError } from "@/lib/db-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "15", 10)));
  const search = searchParams.get("search")?.trim() || undefined;
  const statusParam = searchParams.get("status")?.trim() || undefined;
  const status = statusParam as PaymentStatus | undefined;

  return NextResponse.json(
    listPaymentRequestsPaginated({ page, limit, search, status }),
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customerName,
      email,
      phone,
      packageName,
      park,
      safariType,
      timeSlot,
      mealPreference,
      safariDate,
      guests,
      notes,
      amount,
      currency,
      expiresInHours,
    } = body ?? {};

    if (!customerName || typeof customerName !== "string") {
      return NextResponse.json(
        { error: "customerName is required" },
        { status: 400 },
      );
    }
    const normalizedPhone =
      typeof phone === "string" ? normalizeSriLankanPhone(phone) : null;
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: SRI_LANKA_PHONE_FORMAT_ERROR },
        { status: 400 },
      );
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number (major units, e.g. 1500.00)" },
        { status: 400 },
      );
    }
    // OnePay minimum is ~LKR 10 / USD 0.10 — guard against accidental tiny amounts.
    if (amountNumber < 10) {
      return NextResponse.json(
        { error: "Minimum amount is 10.00 (OnePay rejects amounts below this threshold)" },
        { status: 400 },
      );
    }

    const amountMinor = Math.round(amountNumber * 100);

    const cur = (currency ?? "LKR").toString().toUpperCase();
    if (cur !== "LKR" && cur !== "USD") {
      return NextResponse.json(
        { error: "currency must be LKR or USD" },
        { status: 400 },
      );
    }

    const validateEnum = <T extends string>(
      value: unknown,
      allowed: readonly T[],
      field: string,
    ): T | undefined | NextResponse => {
      if (value === undefined || value === null || value === "") return undefined;
      if (!allowed.includes(value as T)) {
        return NextResponse.json(
          { error: `${field} must be one of: ${allowed.join(", ")}` },
          { status: 400 },
        );
      }
      return value as T;
    };

    const validPark = validateEnum<Park>(park, PARKS, "park");
    if (validPark instanceof NextResponse) return validPark;
    const validSafariType = validateEnum<SafariType>(
      safariType,
      SAFARI_TYPES,
      "safariType",
    );
    if (validSafariType instanceof NextResponse) return validSafariType;
    const validTimeSlot = validateEnum<TimeSlot>(
      timeSlot,
      TIME_SLOTS,
      "timeSlot",
    );
    if (validTimeSlot instanceof NextResponse) return validTimeSlot;
    const validMealPref = validateEnum<MealPreference>(
      mealPreference,
      MEAL_PREFERENCES,
      "mealPreference",
    );
    if (validMealPref instanceof NextResponse) return validMealPref;

    const pr = createPaymentRequest({
      customerName: customerName.trim(),
      email: email?.trim() || undefined,
      phone: normalizedPhone,
      packageName: packageName?.trim() || undefined,
      park: validPark,
      safariType: validSafariType,
      timeSlot: validTimeSlot,
      mealPreference: validMealPref,
      safariDate: safariDate?.trim() || undefined,
      guests: guests ? Number(guests) : undefined,
      notes: notes?.trim() || undefined,
      amount: amountMinor,
      currency: cur,
      expiresInHours: expiresInHours ? Number(expiresInHours) : undefined,
      createdBy: session.user?.email ?? session.user?.name ?? "admin",
    });

    return NextResponse.json(pr, { status: 201 });
  } catch (err) {
    console.error("Create payment request error:", err);
    const message = formatDatabaseError(err);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
