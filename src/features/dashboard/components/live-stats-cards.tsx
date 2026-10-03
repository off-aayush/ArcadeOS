"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Monitor, Play, Users, Coins, Eye, EyeOff } from "lucide-react";
import { ApiResponse, DashboardStats } from "@/types";

export function LiveStatsCards() {
  const [revenueVisible, setRevenueVisible] = useState(false);

  const { data } = useQuery<ApiResponse<DashboardStats>>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    refetchInterval: 10000,
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

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Stations */}
      <div className="glass-card p-5 flex items-center justify-between border border-surface-border bg-surface-card/60">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider">Total Stations</p>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.totalStations}</p>
          <p className="text-xs text-surface-muted">{stats.availableStations} Available</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border text-brand bg-brand/10 border-brand/20">
          <Monitor className="h-6 w-6" />
        </div>
      </div>

      {/* Active Sessions */}
      <div className="glass-card p-5 flex items-center justify-between border border-surface-border bg-surface-card/60">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider">Active Sessions</p>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.activeSessions}</p>
          <p className="text-xs text-surface-muted">{stats.occupiedStations} Stations Active</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border text-accent bg-accent/10 border-accent/20">
          <Play className="h-6 w-6" />
        </div>
      </div>

      {/* New Customers */}
      <div className="glass-card p-5 flex items-center justify-between border border-surface-border bg-surface-card/60">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider">New Customers</p>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.todayCustomers}</p>
          <p className="text-xs text-surface-muted">{"Today's footfall"}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border text-success bg-success/10 border-success/20">
          <Users className="h-6 w-6" />
        </div>
      </div>

      {/* Today's Revenue — with visibility toggle */}
      <div className="glass-card p-5 flex items-center justify-between border border-surface-border bg-surface-card/60">
        <div className="space-y-1 min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider">{"Today's Revenue"}</p>
            <button
              onClick={() => setRevenueVisible((v) => !v)}
              aria-label={revenueVisible ? "Hide today's revenue" : "Show today's revenue"}
              title={revenueVisible ? "Hide revenue" : "Show revenue"}
              className="text-surface-muted hover:text-white transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
            >
              {revenueVisible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight tabular-nums" aria-live="polite">
            {revenueVisible ? formatCurrency(stats.todayRevenue) : "₹ *****"}
          </p>
          <p className="text-xs text-surface-muted">Settle payments</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-warning bg-warning/10 border-warning/20">
          <Coins className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
