import { getAdminEnvStatus } from "@/lib/admin-env-status";
import AdminDashboardShell from "./AdminDashboardShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const envStatus = getAdminEnvStatus();

  return (
    <AdminDashboardShell envStatus={envStatus}>{children}</AdminDashboardShell>
  );
}
