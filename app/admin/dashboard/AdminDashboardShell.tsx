"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiLayout,
  FiFileText,
  FiPlus,
  FiLogOut,
  FiMenu,
  FiX,
  FiCreditCard,
} from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import type { AdminEnvStatus } from "@/lib/admin-env-status";

function EnvBadge({ status }: { status: AdminEnvStatus }) {
  if (status.paymentsLive) {
    return (
      <div
        className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-300"
        title="OnePay live credentials are configured — real payments are enabled."
      >
        Payment Live
      </div>
    );
  }

  if (!status.paymentsConfigured) {
    return (
      <div
        className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300"
        title="Set ONEPAY_APP_ID, ONEPAY_APP_TOKEN, and ONEPAY_HASH_SALT in the server environment."
      >
        Payments not configured
      </div>
    );
  }

  const label = status.appEnv.toUpperCase();
  const isQa = status.appEnv === "qa";

  return (
    <div
      className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
        isQa
          ? "bg-orange-100 text-orange-800 border border-orange-300"
          : "bg-yellow-100 text-yellow-900 border border-yellow-300"
      }`}
      title="OnePay is using sandbox credentials — test payments only."
    >
      {label} · SANDBOX
    </div>
  );
}

export default function AdminDashboardShell({
  children,
  envStatus,
}: {
  children: React.ReactNode;
  envStatus: AdminEnvStatus;
}) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [status, router]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 p-6 space-y-4">
          <div className="animate-pulse space-y-2 pb-4 border-b border-gray-100">
            <div className="h-6 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center gap-3 px-2 py-2"
            >
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </aside>
        <main className="flex-1 p-8 space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-xl border border-gray-200 p-6 space-y-3"
              >
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-8 w-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: FiLayout },
    { href: "/admin/dashboard/blogs", label: "View Blogs", icon: FiFileText },
    {
      href: "/admin/dashboard/blogs/create",
      label: "Create Blog",
      icon: FiPlus,
    },
    {
      href: "/admin/dashboard/payments",
      label: "Payments",
      icon: FiCreditCard,
    },
    {
      href: "/admin/dashboard/payments/create",
      label: "New Payment Link",
      icon: FiPlus,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white shadow-lg border-r border-gray-200 transition-transform duration-300 ease-in-out`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
              <p className="text-sm text-gray-500 mt-1">Blog & Payments</p>
              <EnvBadge status={envStatus} />
              {session?.user && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "Admin"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-accent text-muted font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <FiLogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
