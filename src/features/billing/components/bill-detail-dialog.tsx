"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BillWithDetails } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ApiResponse } from "@/types";
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  calculateSessionAmount,
} from "@/lib/utils";
import { MIN_BILLABLE_MS, STATION_TYPE_LABELS } from "@/lib/constants";
import {
  Receipt,
  Printer,
  Gamepad2,
  Users,
  Clock,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "./payment-dialog";
import { ApplyDiscountDialog } from "./apply-discount-dialog";
import { AddAdjustmentDialog } from "./add-adjustment-dialog";
import { Tag, SlidersHorizontal } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";

interface BillDetailDialogProps {
  /** Pass a sessionId to trigger "generate then show" flow */
  sessionId?: string;
  /** Pass an existing bill to go straight to "view" mode */
  bill?: BillWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
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

export function BillDetailDialog({
  sessionId,
  bill: initialBill,
  isOpen,
  onClose,
}: BillDetailDialogProps) {
  const queryClient = useQueryClient();
  const [bill, setBill] = useState<BillWithDetails | null>(initialBill ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  // Inline order item mutation — only available on DRAFT/PENDING bills
  const canEditOrderItems =
    bill !== null && bill.status !== "PAID" && bill.status !== "VOIDED";

  const handleUpdateOrderQty = async (billItemId: string, newQty: number) => {
    if (!bill) return;
    const endpoint = API_ROUTES.orderItem(bill.session.id, billItemId);
    setLoadingItems((p) => ({ ...p, [billItemId]: true }));
    try {
      const res = await fetch(
        newQty < 1 ? endpoint : endpoint,
        {
          method: newQty < 1 ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          ...(newQty >= 1 && { body: JSON.stringify({ quantity: newQty }) }),
        }
      );
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to update item");
      }
      setBill(data.data);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setLoadingItems((p) => ({ ...p, [billItemId]: false }));
    }
  };

  // Auto-generate when dialog opens with a sessionId and no bill yet
  const handleGenerate = async () => {
    if (!sessionId) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          "error" in data ? data.error : "Failed to generate invoice"
        );
      }
      setBill(data.data);
      // Invalidate sessions list so the bill column updates
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.add({
        title: "Invoice Generated",
        description: `Bill ${data.data.billNumber} created.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.message,
        type: "error",
      });
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger generation as soon as the dialog opens (if needed)
  useEffect(() => {
    if (isOpen) {
      if (initialBill) {
        setBill(initialBill);
      } else if (sessionId && !bill && !isGenerating) {
        handleGenerate();
      }
    } else {
      // Reset state when closed
      setBill(null);
    }
  }, [isOpen, initialBill, sessionId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handlePrint = () => window.print();

  // ── Derived values ────────────────────────────────────────────────────────
  const session = bill?.session;
  const durationMs = session?.endTime
    ? Math.max(
      new Date(session.endTime).getTime() -
      new Date(session.startTime).getTime() -
      (session.totalPausedMs ?? 0),
      MIN_BILLABLE_MS
    )
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-surface-card border-surface-border text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-surface-border bg-surface/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Receipt className="h-5 w-5 text-brand" />
            Invoice
          </DialogTitle>
        </DialogHeader>

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 text-brand animate-spin" />
            <p className="text-sm text-surface-muted">Generating invoice…</p>
          </div>
        )}

        {/* ── Bill content ──────────────────────────────────────────────── */}
        {!isGenerating && bill && (
          <div className="space-y-5 p-5 max-h-[70vh] overflow-y-auto">
            {/* Bill header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-surface-muted uppercase tracking-wider">
                  Bill Number
                </p>
                <p className="font-mono text-lg font-bold text-white">
                  {bill.billNumber}
                </p>
              </div>
              <BillStatusBadge status={bill.status} />
            </div>

            {/* Session Context */}
            <div className="rounded-lg bg-surface p-4 border border-surface-border/50 space-y-3">
              <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider">
                Session Details
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {/* Station */}
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-brand shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-surface-muted">Station</span>
                    <span className="font-medium text-white">
                      {session?.station.name}
                    </span>
                    <span className="text-xs text-surface-muted">
                      {STATION_TYPE_LABELS[
                        session?.station.type as keyof typeof STATION_TYPE_LABELS
                      ] ?? session?.station.type}
                    </span>
                  </div>
                </div>
                {/* Customer */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-surface-muted shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-surface-muted">Customer</span>
                    <span className="font-medium text-white">
                      {session?.customer?.name ?? "Walk-in"}
                    </span>
                    {session?.customer?.phone && (
                      <span className="text-xs text-surface-muted">
                        {session.customer.phone}
                      </span>
                    )}
                  </div>
                </div>
                {/* Date */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-surface-muted shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-surface-muted">Date</span>
                    <span className="font-medium text-white">
                      {formatDateTime(bill.createdAt)}
                    </span>
                  </div>
                </div>
                {/* Duration */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-surface-muted shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-surface-muted">Duration</span>
                    <span className="font-mono font-medium text-white">
                      {formatDuration(durationMs)}
                    </span>
                    {(session?.totalPausedMs ?? 0) > 0 && (
                      <span className="text-xs text-warning/80">
                        ({formatDuration(session!.totalPausedMs)} paused)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-surface-muted uppercase tracking-wider mb-1.5">
                Charges
              </p>
              <div className="rounded-lg border border-surface-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border/50 bg-surface/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-surface-muted">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-surface-muted">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-surface-muted">
                        Unit Price
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-surface-muted">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item) => {
                      const isFoodDrink = item.type === "FOOD" || item.type === "DRINK";
                      const isMutating = !!loadingItems[item.id];
                      const qty = Number(item.quantity);
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-surface-border/50 last:border-0"
                        >
                          <td className="px-4 py-3 text-white">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-right text-surface-muted font-mono">
                            {isFoodDrink && canEditOrderItems ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleUpdateOrderQty(item.id, qty - 1)}
                                  disabled={isMutating}
                                  className="h-5 w-5 rounded border border-surface-border bg-surface text-white hover:bg-surface-hover transition-colors flex items-center justify-center disabled:opacity-40"
                                >
                                  {isMutating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : qty === 1 ? <Trash2 className="h-2.5 w-2.5 text-danger" /> : <Minus className="h-2.5 w-2.5" />}
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-white">{qty}</span>
                                <button
                                  onClick={() => handleUpdateOrderQty(item.id, qty + 1)}
                                  disabled={isMutating}
                                  className="h-5 w-5 rounded border border-surface-border bg-surface text-white hover:bg-surface-hover transition-colors flex items-center justify-center disabled:opacity-40"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ) : (
                              qty
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-mono">
                            {Number(item.unitPrice) < 0
                              ? `−${formatCurrency(Math.abs(Number(item.unitPrice)))}`
                              : formatCurrency(Number(item.unitPrice))}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 text-right font-mono font-semibold",
                              Number(item.totalPrice) < 0
                                ? "text-success"
                                : "text-white"
                            )}
                          >
                            {Number(item.totalPrice) < 0
                              ? `−${formatCurrency(Math.abs(Number(item.totalPrice)))}`
                              : formatCurrency(Number(item.totalPrice))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg bg-surface p-4 border border-surface-border/50 space-y-1.5">
              <div className="flex justify-between text-sm text-surface-muted">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(Number(bill.subtotal))}</span>
              </div>
              {Number(bill.discountTotal) !== 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span className="font-mono">−{formatCurrency(Number(bill.discountTotal))}</span>
                </div>
              )}
              {Number(bill.roundingAmount) !== 0 && (
                <div className="flex justify-between text-xs text-surface-muted">
                  <span>Rounding</span>
                  <span className="font-mono">
                    {Number(bill.roundingAmount) > 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(Number(bill.roundingAmount)))}
                  </span>
                </div>
              )}
              <div className="border-t border-surface-border pt-2 flex justify-between text-base font-bold">
                <span className="text-white">Grand Total</span>
                <span className="font-mono text-brand text-lg">
                  {formatCurrency(Number(bill.grandTotal))}
                </span>
              </div>
              {Number(bill.amountPaid) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-success">
                    <span>Amount Paid</span>
                    <span className="font-mono">
                      {formatCurrency(Number(bill.amountPaid))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-white">
                    <span>Balance Due</span>
                    <span className="font-mono">
                      {formatCurrency(Number(bill.amountDue))}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Paid stamp */}
            {bill.status === "PAID" && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 py-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-bold text-success">PAID IN FULL</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className=" m-1 p-4 border-t border-surface-border bg-surface/50 gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-surface-border text-white hover:bg-surface"
          >
            Close
          </Button>
          <div className="flex gap-2">
            {bill && (bill.status === "PENDING" || bill.status === "PARTIALLY_PAID") && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDiscountDialogOpen(true)}
                  className="border-surface-border text-white hover:bg-surface hover:text-success gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Discount
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAdjustmentDialogOpen(true)}
                  className="border-surface-border text-white hover:bg-surface hover:text-warning gap-2 mr-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Adjust
                </Button>
              </>
            )}
            {bill && Number(bill.amountDue) > 0 && (
              <Button
                onClick={() => setIsPaymentDialogOpen(true)}
                className="bg-accent hover:bg-accent/80 text-white font-semibold"
              >
                Record Payment
              </Button>
            )}
            {bill && (
              <Button
                onClick={handlePrint}
                className="bg-brand hover:bg-brand/80 text-white font-semibold gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Payment Dialog */}
      {bill && (
        <PaymentDialog
          bill={bill}
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          onSuccess={(updatedBill) => {
            setBill(updatedBill);
            queryClient.invalidateQueries({ queryKey: ["bills"] });
          }}
        />
      )}

      {/* Discount Dialog */}
      {bill && (
        <ApplyDiscountDialog
          bill={bill}
          isOpen={isDiscountDialogOpen}
          onClose={() => setIsDiscountDialogOpen(false)}
          onSuccess={(updatedBill) => {
            setBill(updatedBill);
            queryClient.invalidateQueries({ queryKey: ["bills"] });
          }}
        />
      )}

      {/* Adjustment Dialog */}
      {bill && (
        <AddAdjustmentDialog
          bill={bill}
          isOpen={isAdjustmentDialogOpen}
          onClose={() => setIsAdjustmentDialogOpen(false)}
          onSuccess={(updatedBill) => {
            setBill(updatedBill);
            queryClient.invalidateQueries({ queryKey: ["bills"] });
          }}
        />
      )}
    </Dialog>
  );
}
