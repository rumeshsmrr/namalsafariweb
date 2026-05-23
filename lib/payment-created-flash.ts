/** Session flash after creating a payment link (survives redirect to list). */
export const PAYMENT_CREATED_FLASH_KEY = "nimalsafari:lastCreatedPayment";

export type PaymentCreatedFlash = {
  id: string;
  token: string;
  customerName: string;
  payUrl: string;
};

export function savePaymentCreatedFlash(data: PaymentCreatedFlash): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PAYMENT_CREATED_FLASH_KEY, JSON.stringify(data));
}

export function readPaymentCreatedFlash(): PaymentCreatedFlash | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(PAYMENT_CREATED_FLASH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PaymentCreatedFlash;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.token === "string" &&
      typeof parsed.customerName === "string" &&
      typeof parsed.payUrl === "string"
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearPaymentCreatedFlash(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PAYMENT_CREATED_FLASH_KEY);
}
