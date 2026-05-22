/**
 * Payment persistence: SQLite on local/VPS, JSON file on Vercel (SQLite often fails).
 */
export * from "@/lib/payment-types";

import { shouldUseJsonPaymentStorage } from "@/lib/data-path";
import * as jsonStore from "@/lib/payment-json-store";
import * as sqliteStore from "@/lib/payment-sqlite-store";

const store = shouldUseJsonPaymentStorage() ? jsonStore : sqliteStore;

export const createPaymentRequest = store.createPaymentRequest;
export const getPaymentRequestById = store.getPaymentRequestById;
export const getPaymentRequestByToken = store.getPaymentRequestByToken;
export const getPaymentRequestByShortRef = store.getPaymentRequestByShortRef;
export const listPaymentRequests = store.listPaymentRequests;
export const listPaymentRequestsPaginated = store.listPaymentRequestsPaginated;
export const deletePaymentRequest = store.deletePaymentRequest;
export const updatePaymentRequestStatus = store.updatePaymentRequestStatus;
export const refreshExpiryIfNeeded = store.refreshExpiryIfNeeded;
export const recordPaymentAndSetStatus = store.recordPaymentAndSetStatus;
export const getPaymentsForRequest = store.getPaymentsForRequest;

export function getPaymentStorageDriver(): "json" | "sqlite" {
  return shouldUseJsonPaymentStorage() ? "json" : "sqlite";
}
