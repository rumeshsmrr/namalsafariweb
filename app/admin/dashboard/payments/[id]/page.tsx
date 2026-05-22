import Link from "next/link";
import { usesEphemeralStorage } from "@/lib/data-path";
import {
  getPaymentRequestById,
  getPaymentsForRequest,
  PARK_LABELS,
  SAFARI_TYPE_LABELS,
  TIME_SLOT_LABELS,
  MEAL_PREFERENCE_LABELS,
} from "@/lib/payment-storage";
import PaymentLinkCopy from "./PaymentLinkCopy";
import StatusOverride from "./StatusOverride";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-200 text-gray-700",
  SUCCESS: "bg-green-100 text-green-800",
};

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 grid grid-cols-3 gap-4 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-800">{value}</dd>
    </div>
  );
}

export default async function PaymentDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const pr = getPaymentRequestById(id);
  if (!pr) {
    const ephemeral = usesEphemeralStorage();
    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold text-primary">Payment not found</h1>
        <p className="text-gray-600">
          No payment with ID <span className="font-mono text-sm">{id}</span> exists
          in the database on this server.
        </p>
        {ephemeral ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-sm space-y-2">
            <p className="font-semibold">Likely cause: Vercel + SQLite</p>
            <p>
              On Vercel, payment data is stored in temporary storage that is not
              shared between requests. The link may have been created successfully,
              but this page runs on a different server instance with an empty
              database.
            </p>
            <p>
              For reliable admin payments, deploy on your VPS with a persistent{" "}
              <code className="text-xs">DATABASE_PATH</code>, or copy the customer
              payment link immediately after creating it (before leaving the form).
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            It may have been deleted, or the ID in the URL is wrong.
          </p>
        )}
        <Link
          href="/admin/dashboard/payments"
          className="inline-block text-accent font-semibold hover:underline"
        >
          ← Back to payments
        </Link>
      </div>
    );
  }

  const payments = getPaymentsForRequest(pr.id);

  const publicBase = process.env.PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!publicBase) {
    console.warn(
      "[payment-link] PUBLIC_APP_URL is not set — payment link URLs shown in admin may be wrong. Set it in your .env file.",
    );
  }
  const publicUrl = `${publicBase ?? "https://nimalsafari.com"}/pay/${pr.token}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Payment Link
          </h1>
          <p className="text-gray-600">Reference: {pr.id}</p>
        </div>
        <Link
          href="/admin/dashboard/payments"
          className="text-accent font-semibold hover:underline"
        >
          ← Back to all links
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block px-3 py-1 rounded text-sm font-semibold ${STATUS_STYLES[pr.status] ?? ""}`}
          >
            {pr.status}
          </span>
          <span className="text-gray-500 text-sm">
            Expires: {new Date(pr.expiresAt).toLocaleString()}
          </span>
        </div>

        <PaymentLinkCopy url={publicUrl} />
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-primary mb-3">Booking details</h2>
        <dl>
          <Row label="Customer" value={pr.customerName} />
          <Row label="Email" value={pr.email ?? "—"} />
          <Row label="Phone" value={pr.phone ?? "—"} />
          <Row
            label="Park"
            value={pr.park ? PARK_LABELS[pr.park] : pr.packageName ?? "—"}
          />
          <Row
            label="Safari type"
            value={
              pr.safariType ? SAFARI_TYPE_LABELS[pr.safariType] : "—"
            }
          />
          <Row
            label="Safari time"
            value={pr.timeSlot ? TIME_SLOT_LABELS[pr.timeSlot] : "—"}
          />
          <Row
            label="Safari date"
            value={pr.safariDate ?? "—"}
          />
          <Row label="Guests" value={pr.guests ?? "—"} />
          <Row
            label="Meal preference"
            value={
              pr.mealPreference
                ? MEAL_PREFERENCE_LABELS[pr.mealPreference]
                : "—"
            }
          />
          <Row
            label="Amount"
            value={
              <span className="font-semibold">
                {money(pr.amount, pr.currency)}
              </span>
            }
          />
          <Row label="Notes" value={pr.notes ?? "—"} />
          <Row
            label="Created"
            value={`${new Date(pr.createdAt).toLocaleString()} by ${pr.createdBy}`}
          />
        </dl>
      </div>

      <StatusOverride id={pr.id} currentStatus={pr.status} />

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-primary mb-3">
          Transaction history
        </h2>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No transactions yet. The record will appear here once OnePay
            confirms the payment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left py-2">When</th>
                  <th className="text-left py-2">Gateway Txn</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2">
                      {new Date(p.paidAt).toLocaleString()}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {p.transactionId}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[p.status] ?? ""}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2">{money(p.amount, p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
