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
import { BillWithDetails, RecordPaymentInput } from "../types";
import { Coins, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentDialogProps {
  bill: BillWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBill: BillWithDetails) => void;
}

export function PaymentDialog({ bill, isOpen, onClose, onSuccess }: PaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState<string>(bill.amountDue.toString());
  const [method, setMethod] = useState<RecordPaymentInput["method"]>("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset form state
      setTimeout(() => {
        setAmount(bill.amountDue.toString());
        setMethod("CASH");
        setReference("");
        setNotes("");
      }, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.add({ title: "Invalid amount", description: "Payment amount must be greater than 0.", type: "error" });
      return;
    }
    
    if (parsedAmount > Number(bill.amountDue)) {
      toast.add({ title: "Invalid amount", description: `Cannot pay more than the amount due (${formatCurrency(Number(bill.amountDue))}).`, type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, method, reference, notes }),
      });
      
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to record payment");
      }

      toast.add({
        title: "Payment Recorded",
        description: `${formatCurrency(parsedAmount)} received via ${method}.`,
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
            <Coins className="h-5 w-5 text-brand" />
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Amount Due Read-only */}
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex justify-between items-center">
            <span className="text-sm font-medium text-warning">Balance Due</span>
            <span className="text-xl font-bold font-mono text-warning">
              {formatCurrency(Number(bill.amountDue))}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={Number(bill.amountDue)}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface pl-7 pr-4 py-2 text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
            </div>
            <p className="text-[10px] text-surface-muted">
              You can accept partial payments.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Payment Method
            </label>
            <select
              required
              value={method}
              onChange={(e) => setMethod(e.target.value as RecordPaymentInput["method"])}
              className="w-full rounded-lg border border-surface-border bg-surface px-4 py-2 text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="WALLET">Wallet</option>
              <option value="COMPLIMENTARY">Complimentary</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Reference / Txn ID (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI Ref Number"
              className="w-full rounded-lg border border-surface-border bg-surface px-4 py-2 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-surface-muted uppercase">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional info..."
              className="w-full rounded-lg border border-surface-border bg-surface px-4 py-2 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand min-h-[80px]"
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
              className="bg-brand hover:bg-brand-600 text-white gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
