"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Edit2, Wallet } from "lucide-react";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ApiResponse } from "@/types";
import type { SpendingRecord, SpendingTrend } from "../types";
import { SpendingFormDialog } from "./spending-form-dialog";
import { PAYMENT_METHOD_LABELS } from "../payment-methods";

type ListResult = { records: SpendingRecord[]; total: number };
const PAGE_SIZE = 20;

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

async function fetchSpendingData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const result: ApiResponse<T> = await response.json();
  if (result.success === false) {
    throw new Error(result.error || "Failed to load spendings");
  }
  if (!response.ok) throw new Error("Failed to load spendings");
  return result.data;
}

export function SpendingsDashboard() {
  const [range, setRange] = useState<DateRange>(() => {
    const today = new Date();
    return { startDate: dateKey(startOfMonth(today)), endDate: dateKey(endOfMonth(today)) };
  });
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<SpendingRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const rangeValid = range.startDate <= range.endDate;
  const rangeParams = new URLSearchParams({ startDate: range.startDate, endDate: range.endDate });
  const listParams = new URLSearchParams({ startDate: range.startDate, endDate: range.endDate });
  listParams.set("page", String(page));
  listParams.set("pageSize", String(PAGE_SIZE));

  const trendQuery = useQuery({
    queryKey: ["spendings", "trend", range.startDate, range.endDate],
    queryFn: () => fetchSpendingData<SpendingTrend>(`/api/spendings/trend?${rangeParams}`),
    enabled: rangeValid,
    staleTime: 60_000,
  });
  const listQuery = useQuery({
    queryKey: ["spendings", "list", range.startDate, range.endDate, page],
    queryFn: () => fetchSpendingData<ListResult>(`/api/spendings?${listParams}`),
    enabled: rangeValid,
    staleTime: 60_000,
  });
  const records = listQuery.data?.records ?? [];
  const total = listQuery.data?.total ?? 0;

  const changeRange = (next: DateRange) => {
    setRange(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <section className="glass-card border border-surface-border bg-surface-card/60 p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Spending Trend</h2>
            <p className="mt-1 text-xs text-surface-muted">
              {trendQuery.data?.groupBy === "week" ? "Weekly" :
                trendQuery.data?.groupBy === "month" ? "Monthly" : "Daily"} totals by spending date
            </p>
            <p className="mt-2 text-2xl font-semibold text-brand">
              {trendQuery.isLoading ? "Loading..." : formatCurrency(trendQuery.data?.total ?? 0)}
            </p>
            <p className="text-xs text-surface-muted">Total spending in selected range</p>
          </div>
          <div className="relative z-50 w-full sm:w-72">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-muted">Date Range</p>
            <DateRangePicker value={range} onChange={changeRange} presets={[
              { label: "This Month", range: () => ({ startDate: dateKey(startOfMonth(new Date())), endDate: dateKey(endOfMonth(new Date())) }) },
              { label: "Last 7 Days", range: () => {
                const start = new Date(); start.setDate(start.getDate() - 6);
                return { startDate: dateKey(start), endDate: dateKey(new Date()) };
              } },
              { label: "Last 30 Days", range: () => {
                const start = new Date(); start.setDate(start.getDate() - 29);
                return { startDate: dateKey(start), endDate: dateKey(new Date()) };
              } },
            ]} />
          </div>
        </div>
        {!rangeValid ? (
          <p role="alert" className="py-8 text-center text-sm text-danger">End date must be on or after start date.</p>
        ) : trendQuery.isError ? (
          <ErrorState title="Failed to Load Spending Trend" error={trendQuery.error}
            onRetry={() => trendQuery.refetch()} />
        ) : trendQuery.isLoading ? (
          <div className="h-[280px] animate-pulse rounded-lg bg-surface-border/30" />
        ) : !trendQuery.data?.points.length ? (
          <EmptyState title="No Spendings in This Period"
            description="Choose another date range or add a spending record." icon={<Wallet className="h-7 w-7" />} />
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendQuery.data.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff60" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(value: string) => value.slice(5)} minTickGap={20} />
                <YAxis stroke="#ffffff60" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(value: number) => formatCurrency(value)} width={75} />
                <Tooltip
                  cursor={{ fill: "#ffffff05" }}
                  contentStyle={{ backgroundColor: "#0f1115", borderColor: "#1f2229", borderRadius: "0.5rem", color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [formatCurrency(Number(value)), "Spending"]}
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="glass-card overflow-hidden border border-surface-border bg-surface-card/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Spending Records</h2>
            <p className="text-xs text-surface-muted">
              {total} record{total === 1 ? "" : "s"} in the selected range · newest spending first
            </p>
          </div>
          <button type="button" onClick={() => { setEditor(null); setFormOpen(true); }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
            + Add Spending
          </button>
        </div>
        {!rangeValid ? (
          <p className="py-12 text-center text-sm text-surface-muted">Select a valid date range.</p>
        ) : listQuery.isError ? (
          <ErrorState title="Failed to Load Spendings" error={listQuery.error}
            onRetry={() => listQuery.refetch()} />
        ) : listQuery.isLoading ? (
          <p role="status" className="py-12 text-center text-sm text-surface-muted">Loading spendings...</p>
        ) : records.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No Spending Records"
              description="No lounge expenses fall within this date range." icon={<Wallet className="h-7 w-7" />} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-surface-muted">
                  <th className="px-4 py-3 font-semibold">Spending</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Payment Method</th>
                  <th className="px-4 py-3 font-semibold">Spent At</th>
                  <th className="px-4 py-3 font-semibold">Created By</th>
                  <th className="px-4 py-3 font-semibold">Last Updated By</th>
                  <th className="px-4 py-3 font-semibold">Last Updated</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-surface-border/50 hover:bg-surface-hover/50">
                    <td className="max-w-64 px-4 py-3">
                      <p className="font-medium text-white">{record.name}</p>
                      {record.description && <p className="mt-0.5 line-clamp-2 text-xs text-surface-muted" title={record.description}>{record.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-white">{formatCurrency(Number(record.amount))}</td>
                    <td className="px-4 py-3 text-xs text-white">{PAYMENT_METHOD_LABELS[record.paymentMethod]}</td>
                    <td className="px-4 py-3 text-xs text-surface-muted">{formatDateTime(record.spentAt)}</td>
                    <td className="px-4 py-3 text-xs text-white">{record.createdBy.name}</td>
                    <td className="px-4 py-3 text-xs text-white">{record.updatedBy.name}</td>
                    <td className="px-4 py-3 text-xs text-surface-muted">{formatDateTime(record.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => { setEditor(record); setFormOpen(true); }}
                        aria-label={`Edit ${record.name}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1.5 text-xs text-white hover:border-brand/50 hover:text-brand">
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-surface-border px-4 py-3 text-sm text-surface-muted">
            <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border border-surface-border px-3 py-1.5 hover:text-white disabled:opacity-50">Previous</button>
              <button type="button" disabled={page * PAGE_SIZE >= total} onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-surface-border px-3 py-1.5 hover:text-white disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </section>
      <SpendingFormDialog record={editor} open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(spentAt) => {
          const date = dateKey(spentAt);
          if (date < range.startDate || date > range.endDate) {
            changeRange({ startDate: dateKey(startOfMonth(spentAt)), endDate: dateKey(endOfMonth(spentAt)) });
            return true;
          }
          return false;
        }}
      />
    </div>
  );
}
