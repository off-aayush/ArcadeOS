"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BillListItem, BillWithDetails } from "../types";
import { BillDetailDialog } from "./bill-detail-dialog";
import { ApiResponse } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Receipt,
  Gamepad2,
  Users,
  RefreshCw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ListResult = { bills: BillListItem[]; total: number };

function BillRowSkeleton() {
  return (
    <tr className="border-b border-surface-border animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-surface-border w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function BillStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-surface border border-surface-border text-surface-muted",
    PENDING: "bg-warning/20 text-warning border border-warning/30",
    PAID: "bg-success/20 text-success border border-success/30",
    PARTIALLY_PAID: "bg-accent/20 text-accent border border-accent/30",
    VOIDED: "bg-danger/20 text-danger border border-danger/30",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        styles[status] ?? styles.DRAFT
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function BillTable() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const params = new URLSearchParams({ status: statusFilter });

  const { data, isLoading, isError, error, refetch } = useQuery<ApiResponse<ListResult>>({
    queryKey: ["bills", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/bills?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load bills");
      return res.json();
    },
  });

  const bills = data?.success ? data.data.bills : [];
  const total = data?.success ? data.data.total : 0;

  // Fetch selected bill detail
  const { data: detailData } = useQuery<ApiResponse<BillWithDetails>>({
    queryKey: ["bill", selectedBillId],
    queryFn: async () => {
      const res = await fetch(`/api/bills/${selectedBillId}`);
      if (!res.ok) throw new Error("Failed to load bill");
      return res.json();
    },
    enabled: !!selectedBillId,
  });

  const selectedBill =
    detailData?.success ? detailData.data : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="VOIDED">Voided</option>
          <option value="DRAFT">Draft</option>
        </select>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-surface-muted hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        {total > 0 && (
          <span className="text-sm text-surface-muted ml-auto">
            {total} bill{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isError ? (
          <ErrorState
            title="Failed to Load Bills"
            description="Could not connect to the database."
            error={error as Error}
            onRetry={refetch}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="px-4 py-3 font-semibold text-surface-muted">Bill #</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Station</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Customer</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Date</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Status</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <BillRowSkeleton key={i} />
                  ))
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16">
                      <EmptyState
                        title="No Bills Found"
                        description="Generate bills from completed sessions."
                        icon={<Receipt className="h-8 w-8 text-surface-muted" />}
                      />
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors"
                    >
                      {/* Bill # */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-brand font-semibold">
                          {bill.billNumber}
                        </span>
                      </td>
                      {/* Station */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Gamepad2 className="h-3.5 w-3.5 text-brand shrink-0" />
                          <span className="text-white">{bill.session.station.name}</span>
                        </div>
                      </td>
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-surface-muted shrink-0" />
                          <span className={cn(bill.session.customer ? "text-white" : "text-surface-muted italic")}>
                            {bill.session.customer?.name ?? "Walk-in"}
                          </span>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-surface-muted text-xs">
                        {formatDateTime(bill.createdAt)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <BillStatusBadge status={bill.status} />
                      </td>
                      {/* Total */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold text-white">
                          {formatCurrency(Number(bill.grandTotal))}
                        </span>
                        {Number(bill.amountDue) > 0 && bill.status !== "PAID" && (
                          <div className="text-xs text-danger/80 font-mono">
                            Due: {formatCurrency(Number(bill.amountDue))}
                          </div>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedBillId(bill.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-surface-border bg-surface text-surface-muted hover:text-white hover:border-brand/50 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Detail Dialog */}
      <BillDetailDialog
        bill={selectedBill}
        isOpen={!!selectedBillId}
        onClose={() => setSelectedBillId(null)}
      />
    </div>
  );
}
