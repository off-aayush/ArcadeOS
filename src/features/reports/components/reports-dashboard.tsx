"use client";

import { useState } from "react";
import { useReports } from "../hooks/use-reports";
import { formatCurrency } from "@/lib/utils";
import { Coins, Users, Gamepad2, TicketPercent, CalendarDays, AlertCircle } from "lucide-react";
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
import { format, startOfMonth, endOfMonth } from "date-fns";

const PIE_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#ef4444", "#06b6d4"];

type PieView = "station" | "inventory";

// Native date input helper — returns "YYYY-MM-DD" for the input value attribute
function toInputDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function ReportsDashboard() {
  const now = new Date();

  // Default to the current calendar month
  const [startDate, setStartDate] = useState(toInputDate(startOfMonth(now)));
  const [endDate, setEndDate] = useState(toInputDate(endOfMonth(now)));

  // Pie chart view toggle
  const [pieView, setPieView] = useState<PieView>("station");

  // Validate dates
  const dateRangeInvalid = startDate && endDate && startDate > endDate;

  const { data: reportData, isLoading, error } = useReports(
    dateRangeInvalid
      ? {} // avoid sending an invalid range to the API
      : { startDate, endDate }
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pieData =
    pieView === "station"
      ? (reportData?.stationRevenue ?? []).map((d) => ({ name: d.type, value: d.revenue }))
      : (reportData?.inventoryRevenue ?? []).map((d) => ({ name: d.name, value: d.revenue }));

  const hasPieData = pieData.some((d) => d.value > 0);

  const periodLabel = startDate && endDate
    ? `${format(new Date(startDate), "dd MMM yyyy")} → ${format(new Date(endDate), "dd MMM yyyy")}`
    : "Current Month";

  const statItems = [
    {
      label: "Total Revenue",
      value: reportData ? formatCurrency(reportData.summary.totalRevenue) : "—",
      subtext: periodLabel,
      icon: Coins,
      color: "text-brand bg-brand/10 border-brand/20",
    },
    {
      label: "Total Sessions",
      value: reportData?.summary.totalSessions ?? "—",
      subtext: periodLabel,
      icon: Gamepad2,
      color: "text-accent bg-accent/10 border-accent/20",
    },
    {
      label: "Active Customers",
      value: reportData?.summary.activeCustomers ?? "—",
      subtext: "Unique players",
      icon: Users,
      color: "text-success bg-success/10 border-success/20",
    },
    {
      label: "Total Discounts",
      value: reportData ? formatCurrency(reportData.summary.totalDiscounts) : "—",
      subtext: "Amount waived",
      icon: TicketPercent,
      color: "text-warning bg-warning/10 border-warning/20",
    },
  ];

  return (
    <div className="flex flex-col flex-1 gap-6 min-h-0">

      {/* ── Date Range Filter ──────────────────────────────────────────────── */}
      <div className="glass-card border border-surface-border bg-surface-card/60 px-5 py-4 shrink-0">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-surface-muted text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-brand" />
            <span>Date Range</span>
          </div>

          <div className="flex flex-wrap items-end gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-surface-muted font-medium">From Date</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-surface-muted font-medium">To Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [color-scheme:dark]"
              />
            </div>

            {/* Quick presets */}
            <div className="flex items-center gap-1.5 ml-auto">
              {[
                { label: "This Month", fn: () => { setStartDate(toInputDate(startOfMonth(now))); setEndDate(toInputDate(endOfMonth(now))); } },
                { label: "Last 7 Days", fn: () => { const s = new Date(now); s.setDate(s.getDate() - 6); setStartDate(toInputDate(s)); setEndDate(toInputDate(now)); } },
                { label: "Last 30 Days", fn: () => { const s = new Date(now); s.setDate(s.getDate() - 29); setStartDate(toInputDate(s)); setEndDate(toInputDate(now)); } },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={p.fn}
                  className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs text-surface-muted hover:border-brand/50 hover:text-brand transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Validation error */}
        {dateRangeInvalid && (
          <div className="mt-3 flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Invalid range: "From Date" must be on or before "To Date".</span>
          </div>
        )}
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
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
                {isLoading ? (
                  <div className="h-7 w-24 animate-pulse rounded bg-surface-border" />
                ) : (
                  <p className="text-2xl font-bold text-white tracking-tight">{item.value}</p>
                )}
                <p className="text-xs text-surface-muted">{item.subtext}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${item.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      {error ? (
        <div className="flex h-64 flex-col items-center justify-center text-danger gap-2">
          <AlertCircle className="h-6 w-6" />
          <p className="text-sm">{error.message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 flex-1 min-h-0">

          {/* Revenue Trend Bar Chart */}
          <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 p-6 lg:col-span-2 min-h-0">
            <h3 className="mb-6 text-lg font-bold text-white tracking-tight shrink-0">Revenue Trend</h3>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand" />
              </div>
            ) : !reportData?.revenueChart?.length ? (
              <div className="flex flex-1 items-center justify-center text-surface-muted text-sm">
                No revenue data for this period.
              </div>
            ) : (
              <div className="w-full flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff60" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#ffffff60"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "#ffffff05" }}
                      contentStyle={{ backgroundColor: "#0f1115", borderColor: "#1f2229", borderRadius: "0.5rem", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Revenue Breakdown Pie Chart */}
          <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 p-6 min-h-0">

            <div className="flex items-start justify-between mb-4 shrink-0">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {pieView === "station" ? "Revenue by Station" : "Revenue by Inventory"}
              </h3>
            </div>

            {/* Toggle */}
            <div className="flex rounded-lg border border-surface-border bg-surface p-1 gap-1 mb-5 shrink-0">
              {(["station", "inventory"] as PieView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setPieView(view)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all capitalize ${pieView === view
                      ? "bg-brand text-white shadow-sm"
                      : "text-surface-muted hover:text-white"
                    }`}
                >
                  {view === "station" ? "🎮 Station" : "🍔 Inventory"}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand" />
              </div>
            ) : !hasPieData ? (
              <div className="flex flex-1 items-center justify-center text-surface-muted text-sm text-center px-4">
                No {pieView === "station" ? "gaming" : "inventory"} revenue for this period.
              </div>
            ) : (
              <div className="w-full flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="none"
                      cornerRadius={4}
                      dataKey="value"
                      nameKey="name"
                      isAnimationActive={true}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#0f1115", borderColor: "#1f2229", borderRadius: "0.5rem", color: "#fff" }}
                      formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend */}
            {hasPieData && !isLoading && (
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-2 shrink-0">
                {pieData.filter((d) => d.value > 0).map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-surface-muted">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="truncate max-w-[80px]" title={entry.name}>{entry.name}</span>
                    <span className="text-white font-medium">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
