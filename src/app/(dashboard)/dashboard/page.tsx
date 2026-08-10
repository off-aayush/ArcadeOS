import { PageHeader } from "@/components/shared/page-header";
import { StationGrid } from "@/features/stations/components/station-grid";
import { LiveStatsCards } from "@/features/dashboard/components/live-stats-cards";
// import { RunningTimersOverview } from "@/features/dashboard/components/running-timers-overview";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Lounge overview, quick session management, and live monitor."
      />

      {/* Overview Stats Cards (Live polling) */}
      <LiveStatsCards />

      {/* Main Grid and Timers */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-4 gap-6"> */}
      <div className="xl:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Gaming Stations</h2>
        </div>
        <StationGrid />
      </div>

      {/* <div className="xl:col-span-1">
          <RunningTimersOverview />
        </div> */}
      {/* </div> */}
    </div>
  );
}
