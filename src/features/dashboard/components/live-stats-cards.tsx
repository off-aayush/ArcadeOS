"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Monitor, Play, Users, Coins } from "lucide-react";
import { ApiResponse, DashboardStats } from "@/types";

export function LiveStatsCards() {
  const { data } = useQuery<ApiResponse<DashboardStats>>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10s
  });

  const stats = data?.success
    ? data.data
    : {
        totalStations: 0,
        availableStations: 0,
        occupiedStations: 0,
        maintenanceStations: 0,
        activeSessions: 0,
        todayRevenue: 0,
        todayCustomers: 0,
        avgSessionDurationMs: 0,
      };

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
  );
}
