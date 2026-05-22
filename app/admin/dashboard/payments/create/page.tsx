"use client";

import { useState } from "react";
import Link from "next/link";
import PaymentLinkCopy from "../[id]/PaymentLinkCopy";
import {
  normalizeSriLankanPhone,
  SRI_LANKA_PHONE_FORMAT_ERROR,
} from "@/lib/phone";

const PARK_OPTIONS = [
  { value: "YALA", label: "Yala National Park" },
  { value: "UDAWALAWE", label: "Udawalawe National Park" },
  { value: "BUNDALA", label: "Bundala National Park" },
  { value: "LUNUGAMWEHERA", label: "Lunugamwehera National Park" },
  { value: "OTHER", label: "Other (specify in notes)" },
] as const;

const SAFARI_TYPE_OPTIONS = [
  { value: "PRIVATE_JEEP", label: "Private Jeep Safari (per jeep)" },
  { value: "SHARED_JEEP", label: "Shared Jeep Safari (per person)" },
  { value: "PARK_TICKETS_ONLY", label: "Park Tickets only" },
  { value: "CUSTOM", label: "Custom (specify in notes)" },
] as const;

const TIME_SLOT_OPTIONS = [
  { value: "MORNING", label: "Morning (4:50 AM – 10:00 AM)" },
  { value: "EVENING", label: "Evening (1:30 PM – 6:30 PM)" },
  { value: "FULL_DAY", label: "Full-Day (4:50 AM – 6:30 PM)" },
] as const;

const MEAL_PREFERENCE_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "VEGAN", label: "Vegan" },
  { value: "VEGETARIAN", label: "Vegetarian" },
  { value: "NON_VEG", label: "Non-Vegetarian" },
] as const;

type CreatedPayment = {
  id: string;
  token: string;
  customerName: string;
};

export default function CreatePaymentLinkPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedPayment | null>(null);
  const [publicPayUrl, setPublicPayUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    park: "",
    safariType: "",
    timeSlot: "",
    mealPreference: "NONE",
    safariDate: "",
    guests: "",
    notes: "",
    amount: "",
    currency: "LKR" as "LKR" | "USD",
    expiresInHours: "72",
  });

  const update = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetail(null);
    setCreated(null);
    setPublicPayUrl(null);

    if (!form.park) {
      setError("Please select a park.");
      return;
    }
    if (!form.safariType) {
      setError("Please select a safari type.");
      return;
    }
    if (!form.timeSlot) {
      setError("Please select a safari time (Morning / Evening / Full-Day).");
      return;
    }
    const normalizedPhone = normalizeSriLankanPhone(form.phone);
    if (!normalizedPhone) {
      setError(SRI_LANKA_PHONE_FORMAT_ERROR);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: normalizedPhone,
          park: form.park || undefined,
          safariType: form.safariType || undefined,
          timeSlot: form.timeSlot || undefined,
          mealPreference:
            form.mealPreference && form.mealPreference !== "NONE"
              ? form.mealPreference
              : undefined,
          guests: form.guests ? Number(form.guests) : undefined,
          amount: Number(form.amount),
          expiresInHours: Number(form.expiresInHours),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create payment link");
        setErrorDetail(
          typeof data.detail === "string"
            ? data.detail
            : data.name
              ? `(${data.name})`
              : null,
        );
        return;
      }
      const base =
        typeof window !== "undefined" ? window.location.origin : "";
      setCreated({
        id: data.id,
        token: data.token,
        customerName: data.customerName,
      });
      setPublicPayUrl(`${base}/pay/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setErrorDetail(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          New Payment Link
        </h1>
        <p className="text-gray-600">
          Fill in the booking details. A unique link will be generated that you
          can share with the customer manually (WhatsApp, email, SMS).
        </p>
      </div>

      {created && publicPayUrl && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-green-900">
            Payment link created for {created.customerName}
          </h2>
          <p className="text-sm text-green-800">
            Copy the link below and send it to the customer (WhatsApp, email, SMS).
            On Vercel hosting, open this page again from the list may not work — save
            the link now.
          </p>
          <PaymentLinkCopy url={publicPayUrl} />
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/admin/dashboard/payments/${created.id}`}
              className="text-sm font-semibold text-accent hover:underline"
            >
              View details (may not load on Vercel)
            </Link>
            <Link
              href="/admin/dashboard/payments"
              className="text-sm font-semibold text-gray-600 hover:underline"
            >
              All payments
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setPublicPayUrl(null);
              }}
              className="text-sm font-semibold text-gray-600 hover:underline"
            >
              Create another
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded space-y-2">
            <p className="font-medium">{error}</p>
            {errorDetail && (
              <pre className="text-xs whitespace-pre-wrap break-all text-red-800/90 max-h-48 overflow-auto">
                {errorDetail}
              </pre>
            )}
          </div>
        )}

        {/* Customer */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
            Customer
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                name="customerName"
                value={form.customerName}
                onChange={update}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                placeholder="e.g. Saman Perera"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={update}
                required
                inputMode="tel"
                pattern="\+94[1-9][0-9]{8}"
                title="Use +94 followed by the number without the initial 0, e.g. +94771234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                placeholder="+94771234567"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use country code format, e.g. +94771234567. Do not use
                0771234567 or +940771234567.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests
              </label>
              <input
                type="number"
                name="guests"
                min="1"
                value={form.guests}
                onChange={update}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Safari Selection */}
        <fieldset className="space-y-4 pt-2 border-t border-gray-100">
          <legend className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
            Safari
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Park *
              </label>
              <select
                name="park"
                value={form.park}
                onChange={update}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none bg-white"
              >
                <option value="">Select park…</option>
                {PARK_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safari Type *
              </label>
              <select
                name="safariType"
                value={form.safariType}
                onChange={update}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none bg-white"
              >
                <option value="">Select type…</option>
                {SAFARI_TYPE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safari Time *
              </label>
              <select
                name="timeSlot"
                value={form.timeSlot}
                onChange={update}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none bg-white"
              >
                <option value="">Select time…</option>
                {TIME_SLOT_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safari Date
              </label>
              <input
                type="date"
                name="safariDate"
                value={form.safariDate}
                onChange={update}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Meals */}
        <fieldset className="space-y-4 pt-2 border-t border-gray-100">
          <legend className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
            Meals
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Preference
              </label>
              <select
                name="mealPreference"
                value={form.mealPreference}
                onChange={update}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none bg-white"
              >
                {MEAL_PREFERENCE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Pricing */}
        <fieldset className="space-y-4 pt-2 border-t border-gray-100">
          <legend className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
            Pricing
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="10"
                name="amount"
                value={form.amount}
                onChange={update}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                placeholder="e.g. 15000.00"
              />
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Reference (LKR): Private 15,000/jeep (Morning/Evening) or
                30,000/jeep (Full-Day) · Shared 17,500/person
                (Morning/Evening) or 24,000/person (Full-Day) · Adult ticket
                13,100 · Child ticket 6,500.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency *
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={update}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none bg-white"
              >
                <option value="LKR">LKR (Sri Lankan Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link expires after (hours)
              </label>
              <input
                type="number"
                name="expiresInHours"
                min="1"
                value={form.expiresInHours}
                onChange={update}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              />
            </div>
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (internal)
          </label>
          <textarea
            name="notes"
            rows={3}
            value={form.notes}
            onChange={update}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
            placeholder="Any extra details (e.g. pickup location, special requests)…"
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-muted font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Generate Payment Link"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
