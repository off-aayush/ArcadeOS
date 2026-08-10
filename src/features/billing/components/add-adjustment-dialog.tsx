"use client";

import { useState } from "react";
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
import { formatCurrency } from "@/lib/utils";
import { SlidersHorizontal, Loader2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddAdjustmentDialogProps {
  bill: BillWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBill: BillWithDetails) => void;
}

export function AddAdjustmentDialog({ bill, isOpen, onClose, onSuccess }: AddAdjustmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<"MANUAL_CREDIT" | "MANUAL_CHARGE">("MANUAL_CHARGE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => {
        setType("MANUAL_CHARGE");
        setAmount("");
        setDescription("");
        setNotes("");
      }, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.add({ title: "Invalid amount", description: "Amount must be greater than 0.", type: "error" });
      return;
    }
    if (!description.trim()) {
      toast.add({ title: "Missing description", description: "Please enter a description.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: parsedAmount, description, notes }),
      });
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to add adjustment");
      }

      const label = type === "MANUAL_CREDIT" ? "Credit" : "Charge";
      toast.add({
        title: `${label} Added`,
        description: `${formatCurrency(parsedAmount)} ${label.toLowerCase()} applied.`,
        type: "success",
      });
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
      <DialogContent className="sm:max-w-[425px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <SlidersHorizontal className="h-5 w-5 text-warning" />
            Manual Adjustment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-surface-border overflow-hidden">
            <button
              type="button"
              onClick={() => setType("MANUAL_CHARGE")}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5",
                type === "MANUAL_CHARGE"
                  ? "bg-warning/20 text-warning border-r border-surface-border"
                  : "bg-surface text-surface-muted hover:text-white border-r border-surface-border"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Charge
            </button>
            <button
              type="button"
              onClick={() => setType("MANUAL_CREDIT")}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5",
                type === "MANUAL_CREDIT"
                  ? "bg-success/20 text-success"
                  : "bg-surface text-surface-muted hover:text-white"
              )}
            >
              <Minus className="h-3.5 w-3.5" />
              Give Credit
            </button>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "MANUAL_CHARGE" ? "e.g. Controller rental" : "e.g. Apology credit"}
              className="w-full rounded-lg border border-surface-border bg-surface px-4 py-2 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface pl-7 pr-4 py-2 text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
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
              className={cn(
                "text-white gap-2",
                type === "MANUAL_CHARGE"
                  ? "bg-warning hover:bg-warning/80"
                  : "bg-success hover:bg-success/80"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : type === "MANUAL_CHARGE" ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {isSubmitting ? "Saving..." : type === "MANUAL_CHARGE" ? "Add Charge" : "Give Credit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
