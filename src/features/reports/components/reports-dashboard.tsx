"use client";

import { useState } from "react";
import { useReports } from "../hooks/use-reports";
import { formatCurrency } from "@/lib/utils";
import { Coins, Users, Gamepad2, TicketPercent } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";

const PIE_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#ef4444"];

export function ReportsDashboard() {
  // By default we'll show the last 7 days
  const [dateRange] = useState({
    startDate: subDays(new Date(), 6).toISOString(),
    endDate: new Date().toISOString(),
  });

  const { data: reportData, isLoading, error } = useReports(dateRange);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand" />
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-danger">
        <p>Failed to load report data.</p>
        <p className="text-sm opacity-80">{error?.message}</p>
      </div>
    );
  }

  const { summary, revenueChart, stationUsage } = reportData;

  const statItems = [
    {
      label: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      subtext: "Last 7 days",
      icon: Coins,
      color: "text-brand bg-brand/10 border-brand/20",
    },
    {
      label: "Total Sessions",
      value: summary.totalSessions,
      subtext: "Last 7 days",
      icon: Gamepad2,
      color: "text-accent bg-accent/10 border-accent/20",
    },
    {
      label: "Active Customers",
      value: summary.activeCustomers,
      subtext: "Unique players",
      icon: Users,
      color: "text-success bg-success/10 border-success/20",
    },
    {
      label: "Total Discounts",
      value: formatCurrency(summary.totalDiscounts),
      subtext: "Amount waived",
      icon: TicketPercent,
      color: "text-warning bg-warning/10 border-warning/20",
    },
  ];

  return (
    <div className="space-y-6">
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Trend Chart */}
        <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 p-6 lg:col-span-2">
          <h3 className="mb-6 text-lg font-bold text-white tracking-tight">Revenue Trend</h3>
          <div className="h-80 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff60" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis
                  stroke="#ffffff60"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <RechartsTooltip
                  cursor={{ fill: "#ffffff05" }}
                  contentStyle={{
                    backgroundColor: "#0f1115",
                    borderColor: "#1f2229",
                    borderRadius: "0.5rem",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Usage Chart */}
        <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 p-6">
          <h3 className="mb-6 text-lg font-bold text-white tracking-tight">Station Usage</h3>
          <div className="h-80 w-full flex-1">
            {stationUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stationUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="sessions"
                    nameKey="type"
                  >
                    {stationUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0f1115",
                      borderColor: "#1f2229",
                      borderRadius: "0.5rem",
                      color: "#fff",
                    }}
                    formatter={(value: any, name: any) => [`${value} sessions`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-surface-muted text-sm">
                No session data available.
              </div>
            )}
          </div>
          {/* Custom Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {stationUsage.map((entry, index) => (
              <div key={entry.type} className="flex items-center gap-1.5 text-xs text-surface-muted">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                {entry.type}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
