"use client";

import { useState } from "react";
import { useReports } from "../hooks/use-reports";
import { formatCurrency } from "@/lib/utils";
import { Coins, Users, Gamepad2, TicketPercent, AlertCircle } from "lucide-react";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
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
const ADJ_COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

type PieView = "station" | "inventory";
type AdjTab = "summary" | "categories" | "breakdown";

function toInputDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Spinner
// ─────────────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Empty State
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-surface-muted text-sm text-center px-4 py-12">
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared pie legend
// ─────────────────────────────────────────────────────────────────────────────
function PieLegend({
  items,
  colors,
  valueFormatter,
}: {
  items: { name: string; value: number }[];
  colors: string[];
  valueFormatter: (v: number) => string;
}) {
  const visible = items.filter((d) => d.value > 0);
  if (!visible.length) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {visible.map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-[11px] text-surface-muted">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: colors[index % colors.length] }}
          />
          <span className="truncate max-w-[80px]" title={entry.name}>
            {entry.name}
          </span>
          <span className="font-medium text-white">{valueFormatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function ReportsDashboard() {
  const now = new Date();

  const [range, setRange] = useState<DateRange>({
    startDate: toInputDate(startOfMonth(now)),
    endDate: toInputDate(endOfMonth(now)),
  });
  const { startDate, endDate } = range;
  const [paymentMode, setPaymentMode] = useState<string>("ALL");
  const [pieView, setPieView] = useState<PieView>("station");
  const [adjTab, setAdjTab] = useState<AdjTab>("summary");

  const dateRangeInvalid = startDate && endDate && startDate > endDate;

  const { data: reportData, isLoading, error } = useReports(
    dateRangeInvalid ? {} : { startDate, endDate, paymentMode }
  );

  // Revenue by station or inventory pie data
  const revPieData =
    pieView === "station"
      ? (reportData?.stationRevenue ?? []).map((d) => ({ name: d.type, value: d.revenue }))
      : (reportData?.inventoryRevenue ?? []).map((d) => ({ name: d.name, value: d.revenue }));
  const hasRevPieData = revPieData.some((d) => d.value > 0);

  // Category pie data for manual adjustments
  const adjPieData = (reportData?.manualAdjustments.byCategory ?? [])
    .map((c) => ({
      name: c.label,
      value: c.creditAmount + c.chargeAmount,
      creditAmount: c.creditAmount,
      chargeAmount: c.chargeAmount,
      count: c.count,
    }))
    .filter((c) => c.value > 0);

  const periodLabel =
    startDate && endDate
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
    <div className="flex flex-col gap-5">

      {/* ── Row 0: Summary Stats + Date Filter ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="glass-card flex items-center justify-between border border-surface-border bg-surface-card/60 p-4"
            >
              <div className="min-w-0 flex-1 space-y-0.5 pr-2">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-surface-muted">
                  {item.label}
                </p>
                {isLoading ? (
                  <div className="h-6 w-20 animate-pulse rounded bg-surface-border" />
                ) : (
                  <p className="truncate text-xl font-bold tracking-tight text-white">{item.value}</p>
                )}
                <p className="truncate text-[10px] text-surface-muted">{item.subtext}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}

        {/* Filters Card */}
        <div className="glass-card relative z-50 flex flex-col justify-between gap-3 border border-surface-border bg-surface-card/60 p-4 xl:col-span-1">
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-muted">Date Range</p>
              <DateRangePicker
                value={range}
                onChange={setRange}
                presets={[
                  {
                    label: "This Month",
                    range: () => ({ startDate: toInputDate(startOfMonth(now)), endDate: toInputDate(endOfMonth(now)) }),
                  },
                  {
                    label: "Last 7 Days",
                    range: () => {
                      const s = new Date(now);
                      s.setDate(s.getDate() - 6);
                      return { startDate: toInputDate(s), endDate: toInputDate(now) };
                    },
                  },
                  {
                    label: "Last 30 Days",
                    range: () => {
                      const s = new Date(now);
                      s.setDate(s.getDate() - 29);
                      return { startDate: toInputDate(s), endDate: toInputDate(now) };
                    },
                  },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-muted">Payment Mode</p>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              >
                <option value="ALL">All Modes</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="WALLET">Wallet</option>
                <option value="COMPLIMENTARY">Complimentary</option>
              </select>
            </div>
          </div>
          {dateRangeInvalid && (
            <div className="flex items-center gap-1 text-[10px] text-danger mt-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>From must be ≤ To</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* ── Row 1: Revenue Trend — full width ───────────────────────────────── */}
      <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 p-6">
        <h3 className="mb-5 shrink-0 text-base font-bold tracking-tight text-white">Revenue Trend</h3>
        {isLoading ? (
          <Spinner />
        ) : !reportData?.revenueChart?.length ? (
          <EmptyState label="No revenue data for this period." />
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.revenueChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff60" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#ffffff60"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                  width={60}
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
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Row 2: Revenue by Station/Inventory | Manual Adjustments ─────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* ── LEFT: Revenue by Station / Inventory Pie ─────────────────────── */}
        <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 p-6">
          {/* Header + toggle */}
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h3 className="text-base font-bold tracking-tight text-white">
              {pieView === "station" ? "Revenue by Station" : "Revenue by Inventory"}
            </h3>
          </div>
          <div className="mb-4 flex shrink-0 gap-1 rounded-lg border border-surface-border bg-surface p-1">
            {(["station", "inventory"] as PieView[]).map((view) => (
              <button
                key={view}
                onClick={() => setPieView(view)}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${pieView === view ? "bg-brand text-white shadow-sm" : "text-surface-muted hover:text-white"
                  }`}
              >
                {view === "station" ? "🎮 Station" : "🍔 Inventory"}
              </button>
            ))}
          </div>

          {/* Chart area */}
          {isLoading ? (
            <Spinner />
          ) : !hasRevPieData ? (
            <EmptyState
              label={`No ${pieView === "station" ? "gaming" : "inventory"} revenue for this period.`}
            />
          ) : (
            <div className="flex flex-col">
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revPieData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                      stroke="none"
                      cornerRadius={4}
                      dataKey="value"
                      nameKey="name"
                      isAnimationActive={true}
                    >
                      {revPieData
                        .filter((d) => d.value > 0)
                        .map((_, index) => (
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
                      formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <PieLegend
                items={revPieData}
                colors={PIE_COLORS}
                valueFormatter={formatCurrency}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT: Manual Adjustments (tabbed card) ──────────────────────── */}
        <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 p-6">
          {/* Header */}
          <div className="mb-4 shrink-0">
            <h3 className="text-base font-bold tracking-tight text-white">Manual Adjustments</h3>
          </div>

          {/* Tab switcher */}
          <div className="mb-4 flex shrink-0 gap-1 rounded-lg border border-surface-border bg-surface p-1">
            {(["summary", "categories", "breakdown"] as AdjTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setAdjTab(tab)}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-all ${adjTab === tab ? "bg-brand text-white shadow-sm" : "text-surface-muted hover:text-white"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {isLoading ? (
            <Spinner />
          ) : (
            <div className="flex flex-1 flex-col">

              {/* ── Summary ── */}
              {adjTab === "summary" && (
                <div className="grid grid-cols-2 gap-5 py-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-muted">
                      Total Credits
                    </p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(reportData?.manualAdjustments.totalCredits ?? 0)}
                    </p>
                    <p className="text-xs text-surface-muted">
                      {reportData?.manualAdjustments.creditCount ?? 0} entries
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-muted">
                      Total Charges
                    </p>
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(reportData?.manualAdjustments.totalCharges ?? 0)}
                    </p>
                    <p className="text-xs text-surface-muted">
                      {reportData?.manualAdjustments.chargeCount ?? 0} entries
                    </p>
                  </div>
                  <div className="col-span-2 space-y-1 border-t border-surface-border/50 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-muted">
                      Net Adjustment
                    </p>
                    <p
                      className={`text-2xl font-bold ${(reportData?.manualAdjustments.netAdjustment ?? 0) >= 0
                          ? "text-success"
                          : "text-warning"
                        }`}
                    >
                      {(reportData?.manualAdjustments.netAdjustment ?? 0) >= 0 ? "+" : ""}
                      {formatCurrency(reportData?.manualAdjustments.netAdjustment ?? 0)}
                    </p>
                    <p className="text-xs text-surface-muted">
                      {reportData?.manualAdjustments.totalCount ?? 0} total adjustments
                    </p>
                  </div>
                </div>
              )}

              {/* ── Categories pie chart ── */}
              {adjTab === "categories" && (
                <>
                  {!reportData || reportData.manualAdjustments.totalCount === 0 ? (
                    <EmptyState label="No manual adjustments for this period." />
                  ) : (
                    <div className="flex flex-col">
                      <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={adjPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={95}
                              paddingAngle={2}
                              stroke="none"
                              cornerRadius={4}
                              dataKey="value"
                              nameKey="name"
                              isAnimationActive={true}
                            >
                              {adjPieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={ADJ_COLORS[index % ADJ_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="min-w-[160px] rounded-lg border border-[#1f2229] bg-[#0f1115] p-3 shadow-lg">
                                      <p className="mb-2 font-semibold text-white">{d.name}</p>
                                      <div className="flex flex-col gap-1.5 text-xs text-surface-muted">
                                        <div className="flex justify-between gap-4">
                                          <span>Total:</span>
                                          <span className="font-medium text-white">{formatCurrency(d.value)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span>Credits:</span>
                                          <span className="text-success">{formatCurrency(d.creditAmount)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span>Charges:</span>
                                          <span className="text-warning">{formatCurrency(d.chargeAmount)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 mt-0.5 border-t border-surface-border/50 pt-1.5">
                                          <span>Count:</span>
                                          <span className="text-white">{d.count}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <PieLegend
                        items={adjPieData}
                        colors={ADJ_COLORS}
                        valueFormatter={formatCurrency}
                      />
                    </div>
                  )}
                </>
              )}

              {/* ── Breakdown list ── */}
              {adjTab === "breakdown" && (
                <>
                  {!reportData || reportData.manualAdjustments.totalCount === 0 ? (
                    <EmptyState label="No manual adjustments for this period." />
                  ) : (
                    <div className="space-y-3 py-2">
                      {reportData.manualAdjustments.byCategory
                        .filter((c) => c.count > 0)
                        .map((cat, index) => (
                          <div
                            key={cat.category}
                            className="rounded-lg border border-surface-border bg-surface/50 p-3"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: ADJ_COLORS[index % ADJ_COLORS.length] }}
                              />
                              <p className="text-sm font-semibold text-white">{cat.label}</p>
                              <span className="ml-auto text-xs text-surface-muted">{cat.count} entries</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-surface-muted">Credits: </span>
                                <span className="font-medium text-success">{formatCurrency(cat.creditAmount)}</span>
                              </div>
                              <div>
                                <span className="text-surface-muted">Charges: </span>
                                <span className="font-medium text-warning">{formatCurrency(cat.chargeAmount)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
