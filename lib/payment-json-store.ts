import crypto from "crypto";
import fs from "fs";
import {
  ensureDirExists,
  getPaymentsStorePath,
  getWritableDataDir,
} from "@/lib/data-path";
import type {
  CreatePaymentRequestInput,
  GatewayStatus,
  ListPaymentRequestsOptions,
  PaginatedPaymentRequests,
  Payment,
  PaymentRequest,
  PaymentStatus,
} from "@/lib/payment-types";
import {
  PARK_LABELS,
  SAFARI_TYPE_LABELS,
  makeShortRef,
} from "@/lib/payment-types";

type StoreFile = {
  requests: PaymentRequest[];
  payments: Payment[];
};

function readStore(): StoreFile {
  ensureDirExists(getWritableDataDir());
  const filePath = getPaymentsStorePath();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as StoreFile;
    return {
      requests: parsed.requests ?? [],
      payments: parsed.payments ?? [],
    };
  } catch {
    return { requests: [], payments: [] };
  }
}

function writeStore(data: StoreFile): void {
  ensureDirExists(getWritableDataDir());
  fs.writeFileSync(getPaymentsStorePath(), JSON.stringify(data, null, 2));
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

  const derivedPackageName =
    input.packageName ??
    (input.park && input.safariType
      ? `${PARK_LABELS[input.park]} — ${SAFARI_TYPE_LABELS[input.safariType]}`
      : null);

  const pr: PaymentRequest = {
    id,
    shortRef,
    token,
    customerName: input.customerName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    packageName: derivedPackageName,
    park: input.park ?? null,
    safariType: input.safariType ?? null,
    timeSlot: input.timeSlot ?? null,
    mealPlan: input.mealPlan ?? null,
    mealPreference: input.mealPreference ?? null,
    safariDate: input.safariDate ?? null,
    guests: input.guests ?? null,
    notes: input.notes ?? null,
    amount: input.amount,
    currency: input.currency ?? "LKR",
    status: "PENDING",
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
    createdBy: input.createdBy,
  };

  const store = readStore();
  store.requests.push(pr);
  writeStore(store);
  return pr;
}

export function getPaymentRequestById(id: string): PaymentRequest | null {
  return readStore().requests.find((r) => r.id === id) ?? null;
}

export function getPaymentRequestByToken(token: string): PaymentRequest | null {
  return readStore().requests.find((r) => r.token === token) ?? null;
}

export function getPaymentRequestByShortRef(
  shortRef: string,
): PaymentRequest | null {
  return readStore().requests.find((r) => r.shortRef === shortRef) ?? null;
}

export function listPaymentRequests(): PaymentRequest[] {
  return [...readStore().requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function listPaymentRequestsPaginated(
  options: ListPaymentRequestsOptions,
): PaginatedPaymentRequests {
  let rows = listPaymentRequests();

  if (options.search) {
    const q = options.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.customerName.toLowerCase().includes(q) ||
        (r.packageName?.toLowerCase().includes(q) ?? false) ||
        (r.email?.toLowerCase().includes(q) ?? false) ||
        (r.phone?.toLowerCase().includes(q) ?? false),
    );
  }
  if (options.status) {
    rows = rows.filter((r) => r.status === options.status);
  }

  const total = rows.length;
  const offset = (options.page - 1) * options.limit;
  const data = rows.slice(offset, offset + options.limit);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit) || 1,
  };
}

export function deletePaymentRequest(id: string): void {
  const store = readStore();
  store.requests = store.requests.filter((r) => r.id !== id);
  store.payments = store.payments.filter((p) => p.paymentRequestId !== id);
  writeStore(store);
}

export function updatePaymentRequestStatus(
  id: string,
  status: PaymentStatus,
): void {
  const store = readStore();
  const row = store.requests.find((r) => r.id === id);
  if (row) row.status = status;
  writeStore(store);
}

export function refreshExpiryIfNeeded(pr: PaymentRequest): PaymentRequest {
  if (pr.status !== "PENDING") return pr;
  if (new Date(pr.expiresAt).getTime() > Date.now()) return pr;
  updatePaymentRequestStatus(pr.id, "EXPIRED");
  return { ...pr, status: "EXPIRED" };
}

export function recordPaymentAndSetStatus(args: {
  paymentRequestId: string;
  transactionId: string;
  status: GatewayStatus;
  amount: number;
  currency: string;
  rawResponse: string;
}): { recorded: boolean; payment: Payment | null } {
  const store = readStore();
  const existing = store.payments.find(
    (p) => p.transactionId === args.transactionId,
  );
  if (existing) {
    return { recorded: false, payment: existing };
  }

  const id = crypto.randomUUID();
  const paidAt = new Date().toISOString();
  const payment: Payment = {
    id,
    paymentRequestId: args.paymentRequestId,
    gateway: "onepay",
    transactionId: args.transactionId,
    status: args.status,
    amount: args.amount,
    currency: args.currency,
    paidAt,
    rawResponse: args.rawResponse,
  };

  store.payments.push(payment);
  const req = store.requests.find((r) => r.id === args.paymentRequestId);
  if (req) {
    req.status = args.status === "SUCCESS" ? "PAID" : "FAILED";
  }
  writeStore(store);

  return { recorded: true, payment };
}

export function getPaymentsForRequest(requestId: string): Payment[] {
  return readStore()
    .payments.filter((p) => p.paymentRequestId === requestId)
    .sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
}
