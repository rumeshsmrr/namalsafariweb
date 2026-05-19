import { notFound } from "next/navigation";
import {
  getPaymentRequestByToken,
  refreshExpiryIfNeeded,
  PARK_LABELS,
  SAFARI_TYPE_LABELS,
  TIME_SLOT_LABELS,
  MEAL_PREFERENCE_LABELS,
} from "@/lib/payment-storage";
import PayNowButton from "./PayNowButton";

export const dynamic = "force-dynamic";

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

export default async function PayPage(
  props: { params: Promise<{ token: string }> },
) {
  const { token } = await props.params;
  const raw = getPaymentRequestByToken(token);
  if (!raw) notFound();
  const pr = refreshExpiryIfNeeded(raw);

  const statusBanner = (() => {
    if (pr.status === "PAID") {
      return (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
          <p className="font-semibold">This booking is already paid.</p>
          <p className="text-sm">
            Thank you! If you need assistance, please contact Nimal Safari.
          </p>
        </div>
      );
    }
    if (pr.status === "EXPIRED") {
      return (
        <div className="bg-gray-100 border border-gray-200 text-gray-700 rounded-lg p-4">
          <p className="font-semibold">This payment link has expired.</p>
          <p className="text-sm">
            Please contact Nimal Safari to request a new link.
          </p>
        </div>
      );
    }
    if (pr.status === "FAILED") {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-semibold">Previous payment attempt failed.</p>
          <p className="text-sm">
            You can retry below, or contact Nimal Safari for help.
          </p>
        </div>
      );
    }
    return null;
  })();

  const canPay = pr.status === "PENDING" || pr.status === "FAILED";

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Nimal Safari</h1>
          <p className="text-gray-600 mt-1">Secure booking payment</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
          {statusBanner}

          <div>
            <h2 className="text-lg font-bold text-primary mb-3">
              Booking Summary
            </h2>
            <dl className="divide-y divide-gray-100">
              <div className="py-2 grid grid-cols-2 gap-2">
                <dt className="text-sm text-gray-500">Customer</dt>
                <dd className="text-sm text-gray-800 text-right">
                  {pr.customerName}
                </dd>
              </div>
              {pr.park ? (
                <div className="py-2 grid grid-cols-2 gap-2">
                  <dt className="text-sm text-gray-500">Park</dt>
                  <dd className="text-sm text-gray-800 text-right">
                    {PARK_LABELS[pr.park]}
                  </dd>
                </div>
              ) : pr.packageName ? (
                <div className="py-2 grid grid-cols-2 gap-2">
                  <dt className="text-sm text-gray-500">Package</dt>
                  <dd className="text-sm text-gray-800 text-right">
                    {pr.packageName}
                  </dd>
                </div>
              ) : null}
              {pr.safariType && (
                <div className="py-2 grid grid-cols-2 gap-2">
                  <dt className="text-sm text-gray-500">Safari type</dt>
                  <dd className="text-sm text-gray-800 text-right">
                    {SAFARI_TYPE_LABELS[pr.safariType]}
                  </dd>
                </div>
              )}
              {pr.timeSlot && (
                <div className="py-2 grid grid-cols-2 gap-2">
                  <dt className="text-sm text-gray-500">Safari time</dt>
                  <dd className="text-sm text-gray-800 text-right">
                    {TIME_SLOT_LABELS[pr.timeSlot]}
                  </dd>
                </div>
              )}
              {pr.safariDate && (
                <div className="py-2 grid grid-cols-2 gap-2">
                  <dt className="text-sm text-gray-500">Safari date</dt>
                  <dd className="text-sm text-gray-800 text-right">
                    {pr.safariDate}
                  </dd>
                </div>
              )}
              {pr.guests != null && (
                <div className="py-2 grid grid-cols-2 gap-2">
                  <dt className="text-sm text-gray-500">Guests</dt>
                  <dd className="text-sm text-gray-800 text-right">
                    {pr.guests}
                  </dd>
                </div>
              )}
              {pr.mealPreference && pr.mealPreference !== "NONE" && (
                <div className="py-2 grid grid-cols-2 gap-2">
                  <dt className="text-sm text-gray-500">Meal preference</dt>
                  <dd className="text-sm text-gray-800 text-right">
                    {MEAL_PREFERENCE_LABELS[pr.mealPreference]}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600">Total amount</span>
              <span className="text-2xl font-bold text-primary">
                {money(pr.amount, pr.currency)}
              </span>
            </div>
          </div>

          {canPay && <PayNowButton token={pr.token} />}

          <p className="text-xs text-gray-500 text-center">
            Payments are processed securely by OnePay. Nimal Safari never sees
            or stores your card details.
          </p>
        </div>
      </div>
    </main>
  );
}
