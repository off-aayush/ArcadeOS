import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ActiveSessionNotifier } from "@/features/sessions/components/active-session-notifier";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <ActiveSessionNotifier />
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
