"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { Spinner, SkTableRow } from "@/app/Components/Skeleton";

interface PaymentRequest {
  id: string;
  token: string;
  customerName: string;
  packageName: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
}

interface PaginatedResponse {
  data: PaymentRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_STYLES: Record<PaymentRequest["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-200 text-gray-700",
};

const ALL_STATUSES: PaymentRequest["status"][] = [
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
];

const PAGE_LIMIT = 15;

function formatMoney(minor: number, currency: string) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function PaymentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const search = searchParams.get("search") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const [result, setResult] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Push updated URL params (resets to page 1 for filter/search changes)
  const pushParam = useCallback(
    (updates: Record<string, string>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (resetPage) params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  // Debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        pushParam({ search: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/payments?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) await load();
    } finally {
      setDeletingId(null);
    }
  };

  const rows = result?.data ?? [];
  const totalPages = result?.totalPages ?? 0;
  const total = result?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const to = Math.min(page * PAGE_LIMIT, total);

  const COLS = ["Customer", "Package", "Amount", "Status", "Created", "Expires", "Actions"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Payment Links</h1>
          <p className="text-gray-500 text-sm">
            Create and track OnePay payment links for customer bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? (
              <Spinner size={15} className="text-gray-500" />
            ) : (
              <FiRefreshCw size={15} />
            )}
            Refresh
          </button>
          <Link
            href="/admin/dashboard/payments/create"
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-muted font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <FiPlus size={16} />
            New Payment Link
          </Link>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by customer, package, email or phone…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => pushParam({ status: e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                {COLS.map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 font-medium ${h === "Actions" ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(PAGE_LIMIT)].map((_, i) => (
                  <SkTableRow key={i} cols={7} />
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center text-gray-400"
                  >
                    {search || statusFilter
                      ? "No payment links match your search."
                      : "No payment links yet. Click New Payment Link to create one."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.customerName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                      {r.packageName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {formatMoney(r.amount, r.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(r.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/dashboard/payments/${r.id}`}
                          className="text-accent font-semibold hover:underline text-xs"
                        >
                          View
                        </Link>

                        {/* Delete — confirm inline */}
                        {confirmDeleteId === r.id ? (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(r.id)}
                              disabled={deletingId === r.id}
                              className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingId === r.id ? "…" : "Yes, delete"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(r.id)}
                            disabled={deletingId === r.id}
                            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                            title="Delete payment link"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
            <span>
              Showing {from}–{to} of {total} result{total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  pushParam({ page: String(page - 1) }, false)
                }
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  pushParam({ page: String(page + 1) }, false)
                }
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsListPage() {
  return (
    <Suspense>
      <PaymentsContent />
    </Suspense>
  );
}
