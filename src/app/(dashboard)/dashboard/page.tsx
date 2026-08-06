import { PageHeader } from "@/components/shared/page-header";
import { StationGrid } from "@/features/stations/components/station-grid";
import { StationService } from "@/features/stations/services/station.service";
import { formatCurrency } from "@/lib/utils";
import { Monitor, Play, Users, Coins } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const stats = await StationService.getStats();

  const statItems = [
    {
      label: "Total Stations",
      value: stats.totalStations,
      subtext: `${stats.availableStations} Available`,
      icon: Monitor,
      color: "text-brand bg-brand/10 border-brand/20",
    },
    {
      label: "Active Sessions",
      value: stats.activeSessions,
      subtext: `${stats.occupiedStations} Stations Active`,
      icon: Play,
      color: "text-accent bg-accent/10 border-accent/20",
    },
    {
      label: "New Customers",
      value: stats.todayCustomers,
      subtext: "Today's footfall",
      icon: Users,
      color: "text-success bg-success/10 border-success/20",
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      subtext: "Settle payments",
      icon: Coins,
      color: "text-warning bg-warning/10 border-warning/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Lounge overview, quick session management, and live monitor."
      />

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="glass-card p-5 flex items-center justify-between border border-surface-border bg-surface-card/60"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-white tracking-tight">{item.value}</p>
                <p className="text-xs text-surface-muted">{item.subtext}</p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${item.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Gaming Stations</h2>
        </div>
        <StationGrid />
      </div>
    </div>
  );
}
