"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { BillWithDetails } from "../types";
import { Discount } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { API_ROUTES } from "@/lib/constants";
import { Tag, Loader2, Percent, BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyDiscountDialogProps {
  bill: BillWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBill: BillWithDetails) => void;
}

export function ApplyDiscountDialog({ bill, isOpen, onClose, onSuccess }: ApplyDiscountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"template" | "custom">("template");

  const { data: discountsData, isLoading: isLoadingDiscounts } = useQuery<ApiResponse<Discount[]>>({
    queryKey: ["discounts"],
    queryFn: async () => {
      const res = await fetch(API_ROUTES.discounts);
      if (!res.ok) throw new Error("Failed to load discounts");
      return res.json();
    },
    enabled: isOpen,
  });

  const discounts = discountsData?.success ? discountsData.data : [];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => {
        setSelectedDiscountId(null);
        setCustomAmount("");
        setNotes("");
        setMode("template");
      }, 300);
    }
  };

  /** Preview the discount amount for a given template against the current bill subtotal */
  const previewAmount = (discount: Discount): number => {
    const subtotal = Number(bill.subtotal);
    if (discount.type === "PERCENTAGE") {
      let amount = subtotal * Number(discount.value) / 100;
      if (discount.maxAmount && amount > Number(discount.maxAmount)) {
        amount = Number(discount.maxAmount);
      }
      return Math.round(amount * 100) / 100;
    }
    return Number(discount.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body: Record<string, unknown> = { notes };

    if (mode === "template") {
      if (!selectedDiscountId) {
        toast.add({ title: "No discount selected", description: "Please pick a discount template.", type: "error" });
        return;
      }
      body.discountId = selectedDiscountId;
    } else {
      const parsed = parseFloat(customAmount);
      if (isNaN(parsed) || parsed <= 0) {
        toast.add({ title: "Invalid amount", description: "Enter a valid discount amount.", type: "error" });
        return;
      }
      body.customAmount = parsed;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to apply discount");
      }
      toast.add({ title: "Discount Applied", description: "Bill totals updated.", type: "success" });
      onSuccess(data.data);
      handleOpenChange(false);
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Tag className="h-5 w-5 text-success" />
            Apply Discount
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-surface-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("template")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold transition-colors",
                mode === "template"
                  ? "bg-brand/20 text-brand border-r border-surface-border"
                  : "bg-surface text-surface-muted hover:text-white border-r border-surface-border"
              )}
            >
              <Percent className="h-3.5 w-3.5 inline mr-1.5" />
              Templates
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold transition-colors",
                mode === "custom"
                  ? "bg-brand/20 text-brand"
                  : "bg-surface text-surface-muted hover:text-white"
              )}
            >
              <BadgeDollarSign className="h-3.5 w-3.5 inline mr-1.5" />
              Custom Amount
            </button>
          </div>

          {mode === "template" && (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {isLoadingDiscounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                </div>
              ) : discounts.length === 0 ? (
                <p className="text-sm text-surface-muted text-center py-6">
                  No active discount templates available.
                </p>
              ) : (
                discounts.map((d) => {
                  const preview = previewAmount(d);
                  const isSelected = selectedDiscountId === d.id;
                  const meetsMin = !d.minBillAmount || Number(bill.subtotal) >= Number(d.minBillAmount);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      disabled={!meetsMin}
                      onClick={() => setSelectedDiscountId(isSelected ? null : d.id)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-all",
                        isSelected
                          ? "border-success/50 bg-success/10"
                          : meetsMin
                            ? "border-surface-border hover:border-brand/40 bg-surface"
                            : "border-surface-border bg-surface opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-white">{d.name}</p>
                          <p className="text-xs text-surface-muted">
                            {d.type === "PERCENTAGE"
                              ? `${d.value}% off${d.maxAmount ? ` (max ${formatCurrency(Number(d.maxAmount))})` : ""}`
                              : `Flat ${formatCurrency(Number(d.value))} off`}
                            {d.code && <span className="ml-2 font-mono text-brand">#{d.code}</span>}
                          </p>
                          {!meetsMin && (
                            <p className="text-[10px] text-danger mt-0.5">
                              Min bill: {formatCurrency(Number(d.minBillAmount))}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-sm font-bold text-success">
                          −{formatCurrency(preview)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {mode === "custom" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-surface-muted uppercase">
                Discount Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full rounded-lg border border-surface-border bg-surface pl-7 pr-4 py-2 text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Loyalty bonus"
              className="w-full rounded-lg border border-surface-border bg-surface px-4 py-2 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-surface-border gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="bg-transparent border-surface-border text-white hover:bg-surface"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-success hover:bg-success/80 text-white gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              {isSubmitting ? "Applying..." : "Apply Discount"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
