import crypto from "crypto";
import { getDb } from "./db";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";
export type GatewayStatus = "SUCCESS" | "FAILED";

export type Park =
  | "YALA"
  | "UDAWALAWE"
  | "BUNDALA"
  | "LUNUGAMWEHERA"
  | "OTHER";

export type SafariType =
  | "PRIVATE_JEEP"
  | "SHARED_JEEP"
  | "PARK_TICKETS_ONLY"
  | "CUSTOM";

export type TimeSlot = "MORNING" | "EVENING" | "FULL_DAY";

export type MealPlan = "NONE" | "MORNING_BREAKFAST" | "FULL_DAY_MEALS";

export type MealPreference = "NONE" | "VEGAN" | "VEGETARIAN" | "NON_VEG";

export const PARKS: readonly Park[] = [
  "YALA",
  "UDAWALAWE",
  "BUNDALA",
  "LUNUGAMWEHERA",
  "OTHER",
] as const;

export const SAFARI_TYPES: readonly SafariType[] = [
  "PRIVATE_JEEP",
  "SHARED_JEEP",
  "PARK_TICKETS_ONLY",
  "CUSTOM",
] as const;

export const TIME_SLOTS: readonly TimeSlot[] = [
  "MORNING",
  "EVENING",
  "FULL_DAY",
] as const;

export const MEAL_PLANS: readonly MealPlan[] = [
  "NONE",
  "MORNING_BREAKFAST",
  "FULL_DAY_MEALS",
] as const;

export const MEAL_PREFERENCES: readonly MealPreference[] = [
  "NONE",
  "VEGAN",
  "VEGETARIAN",
  "NON_VEG",
] as const;

export const PARK_LABELS: Record<Park, string> = {
  YALA: "Yala National Park",
  UDAWALAWE: "Udawalawe National Park",
  BUNDALA: "Bundala National Park",
  LUNUGAMWEHERA: "Lunugamwehera National Park",
  OTHER: "Other (specify in notes)",
};

export const SAFARI_TYPE_LABELS: Record<SafariType, string> = {
  PRIVATE_JEEP: "Private Jeep Safari (per jeep)",
  SHARED_JEEP: "Shared Jeep Safari (per person)",
  PARK_TICKETS_ONLY: "Park Tickets only",
  CUSTOM: "Custom (specify in notes)",
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: "Morning (4:50 AM – 10:00 AM)",
  EVENING: "Evening (1:30 PM – 6:30 PM)",
  FULL_DAY: "Full-Day (4:50 AM – 6:30 PM)",
};

export const MEAL_PLAN_LABELS: Record<MealPlan, string> = {
  NONE: "No meals",
  MORNING_BREAKFAST: "Morning Breakfast (LKR 1,500/person)",
  FULL_DAY_MEALS: "Full-Day Breakfast + Lunch (LKR 5,500/person)",
};

export const MEAL_PREFERENCE_LABELS: Record<MealPreference, string> = {
  NONE: "None",
  VEGAN: "Vegan",
  VEGETARIAN: "Vegetarian",
  NON_VEG: "Non-Vegetarian",
};

export interface PaymentRequest {
  id: string;
  shortRef: string;              // ≤21 chars, sent to OnePay as `reference`
  token: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  packageName: string | null;
  park: Park | null;
  safariType: SafariType | null;
  timeSlot: TimeSlot | null;
  mealPlan: MealPlan | null;
  mealPreference: MealPreference | null;
  safariDate: string | null;
  guests: number | null;
  notes: string | null;
  amount: number;            // minor units
  currency: string;
  status: PaymentStatus;
  expiresAt: string;         // ISO
  createdAt: string;         // ISO
  createdBy: string;
}

export interface Payment {
  id: string;
  paymentRequestId: string;
  gateway: string;
  transactionId: string;
  status: GatewayStatus;
  amount: number;
  currency: string;
  paidAt: string;
  rawResponse: string;
}

type DbPaymentRequestRow = {
  id: string;
  short_ref: string;
  token: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  package_name: string | null;
  park: Park | null;
  safari_type: SafariType | null;
  time_slot: TimeSlot | null;
  meal_plan: MealPlan | null;
  meal_preference: MealPreference | null;
  safari_date: string | null;
  guests: number | null;
  notes: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  expires_at: string;
  created_at: string;
  created_by: string;
};

type DbPaymentRow = {
  id: string;
  payment_request_id: string;
  gateway: string;
  transaction_id: string;
  status: GatewayStatus;
  amount: number;
  currency: string;
  paid_at: string;
  raw_response: string;
};

function mapRequest(row: DbPaymentRequestRow | undefined): PaymentRequest | null {
  if (!row) return null;
  return {
    id: row.id,
    shortRef: row.short_ref,
    token: row.token,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    packageName: row.package_name,
    park: row.park ?? null,
    safariType: row.safari_type ?? null,
    timeSlot: row.time_slot ?? null,
    mealPlan: row.meal_plan ?? null,
    mealPreference: row.meal_preference ?? null,
    safariDate: row.safari_date,
    guests: row.guests,
    notes: row.notes,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapPayment(row: DbPaymentRow | undefined): Payment | null {
  if (!row) return null;
  return {
    id: row.id,
    paymentRequestId: row.payment_request_id,
    gateway: row.gateway,
    transactionId: row.transaction_id,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    paidAt: row.paid_at,
    rawResponse: row.raw_response,
  };
}

export interface CreatePaymentRequestInput {
  customerName: string;
  email?: string;
  phone?: string;
  packageName?: string;
  park?: Park;
  safariType?: SafariType;
  timeSlot?: TimeSlot;
  mealPlan?: MealPlan;
  mealPreference?: MealPreference;
  safariDate?: string;
  guests?: number;
  notes?: string;
  amount: number;           // minor units
  currency?: string;
  expiresInHours?: number;  // default 72
  createdBy: string;
}

/** Generate a ≤21-char reference safe to send as OnePay `reference`. */
function makeShortRef(id: string): string {
  return id.replace(/-/g, "").slice(0, 21);
}

export function createPaymentRequest(
  input: CreatePaymentRequestInput,
): PaymentRequest {
  const id = crypto.randomUUID();
  const shortRef = makeShortRef(id);
  const token = crypto.randomBytes(24).toString("base64url");
  const now = new Date();
  const expires = new Date(
    now.getTime() + (input.expiresInHours ?? 72) * 60 * 60 * 1000,
  );

  // Auto-derive a human-readable package_name when not supplied, so legacy
  // displays that read packageName still get a useful summary.
  const derivedPackageName =
    input.packageName ??
    (input.park && input.safariType
      ? `${PARK_LABELS[input.park]} — ${SAFARI_TYPE_LABELS[input.safariType]}`
      : null);

  const db = getDb();
  db.prepare(
    `INSERT INTO payment_requests (
      id, short_ref, token, customer_name, email, phone, package_name, park,
      safari_type, time_slot, meal_plan, meal_preference, safari_date,
      guests, notes, amount, currency, status, expires_at, created_at,
      created_by
    ) VALUES (@id, @short_ref, @token, @customer_name, @email, @phone,
      @package_name, @park, @safari_type, @time_slot, @meal_plan,
      @meal_preference, @safari_date, @guests, @notes, @amount, @currency,
      'PENDING', @expires_at, @created_at, @created_by)`,
  ).run({
    id,
    short_ref: shortRef,
    token,
    customer_name: input.customerName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    package_name: derivedPackageName,
    park: input.park ?? null,
    safari_type: input.safariType ?? null,
    time_slot: input.timeSlot ?? null,
    meal_plan: input.mealPlan ?? null,
    meal_preference: input.mealPreference ?? null,
    safari_date: input.safariDate ?? null,
    guests: input.guests ?? null,
    notes: input.notes ?? null,
    amount: input.amount,
    currency: input.currency ?? "LKR",
    expires_at: expires.toISOString(),
    created_at: now.toISOString(),
    created_by: input.createdBy,
  });

  return getPaymentRequestById(id)!;
}

export function getPaymentRequestById(id: string): PaymentRequest | null {
  const row = getDb()
    .prepare("SELECT * FROM payment_requests WHERE id = ?")
    .get(id) as DbPaymentRequestRow | undefined;
  return mapRequest(row);
}

export function getPaymentRequestByToken(token: string): PaymentRequest | null {
  const row = getDb()
    .prepare("SELECT * FROM payment_requests WHERE token = ?")
    .get(token) as DbPaymentRequestRow | undefined;
  return mapRequest(row);
}

export function getPaymentRequestByShortRef(
  shortRef: string,
): PaymentRequest | null {
  const row = getDb()
    .prepare("SELECT * FROM payment_requests WHERE short_ref = ?")
    .get(shortRef) as DbPaymentRequestRow | undefined;
  return mapRequest(row);
}

export function listPaymentRequests(): PaymentRequest[] {
  const rows = getDb()
    .prepare("SELECT * FROM payment_requests ORDER BY created_at DESC")
    .all() as DbPaymentRequestRow[];
  return rows.map((r) => mapRequest(r)!);
}

export interface ListPaymentRequestsOptions {
  page: number;
  limit: number;
  search?: string;
  status?: PaymentStatus | "";
}

export interface PaginatedPaymentRequests {
  data: PaymentRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function listPaymentRequestsPaginated(
  options: ListPaymentRequestsOptions,
): PaginatedPaymentRequests {
  const db = getDb();
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const args: unknown[] = [];

  if (options.search) {
    const like = `%${options.search}%`;
    conditions.push(
      "(customer_name LIKE ? OR package_name LIKE ? OR email LIKE ? OR phone LIKE ?)",
    );
    args.push(like, like, like, like);
  }
  if (options.status) {
    conditions.push("status = ?");
    args.push(options.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) AS count FROM payment_requests ${where}`)
    .get(...(args as [])) as { count: number };

  const rows = db
    .prepare(
      `SELECT * FROM payment_requests ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...(args as []), limit, offset) as DbPaymentRequestRow[];

  const total = countRow.count;
  return {
    data: rows.map((r) => mapRequest(r)!),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function deletePaymentRequest(id: string): void {
  const db = getDb();
  db.transaction(() => {
    db.prepare("DELETE FROM payments WHERE payment_request_id = ?").run(id);
    db.prepare("DELETE FROM payment_requests WHERE id = ?").run(id);
  })();
}

export function updatePaymentRequestStatus(
  id: string,
  status: PaymentStatus,
): void {
  getDb()
    .prepare("UPDATE payment_requests SET status = ? WHERE id = ?")
    .run(status, id);
}

/**
 * Mark a payment request as expired if its window has passed and it's still
 * pending. Returns the (possibly updated) request.
 */
export function refreshExpiryIfNeeded(pr: PaymentRequest): PaymentRequest {
  if (pr.status !== "PENDING") return pr;
  if (new Date(pr.expiresAt).getTime() > Date.now()) return pr;
  updatePaymentRequestStatus(pr.id, "EXPIRED");
  return { ...pr, status: "EXPIRED" };
}

/**
 * Atomically record a gateway payment and update the related request.
 * Returns true if a new payment was recorded, false if it was already recorded
 * (idempotency for webhook retries).
 */
export function recordPaymentAndSetStatus(args: {
  paymentRequestId: string;
  transactionId: string;
  status: GatewayStatus;
  amount: number;
  currency: string;
  rawResponse: string;
}): { recorded: boolean; payment: Payment | null } {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM payments WHERE transaction_id = ?")
    .get(args.transactionId) as DbPaymentRow | undefined;

  if (existing) {
    return { recorded: false, payment: mapPayment(existing) };
  }

  const tx = db.transaction(() => {
    const id = crypto.randomUUID();
    const paidAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO payments (
        id, payment_request_id, gateway, transaction_id, status,
        amount, currency, paid_at, raw_response
      ) VALUES (?, ?, 'onepay', ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      args.paymentRequestId,
      args.transactionId,
      args.status,
      args.amount,
      args.currency,
      paidAt,
      args.rawResponse,
    );

    db.prepare(
      "UPDATE payment_requests SET status = ? WHERE id = ?",
    ).run(args.status === "SUCCESS" ? "PAID" : "FAILED", args.paymentRequestId);

    return id;
  });

  const newId = tx();
  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(newId) as
    | DbPaymentRow
    | undefined;
  return { recorded: true, payment: mapPayment(row) };
}

export function getPaymentsForRequest(requestId: string): Payment[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM payments WHERE payment_request_id = ? ORDER BY paid_at DESC",
    )
    .all(requestId) as DbPaymentRow[];
  return rows.map((r) => mapPayment(r)!);
}
