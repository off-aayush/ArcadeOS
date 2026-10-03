import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Shell */}
      <div className="pl-60">
        {/* Topbar */}
        <Topbar />

        {/* Dynamic Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
