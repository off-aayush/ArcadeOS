"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FoodListItem } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { PackageMinus, PackagePlus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockAdjustDialogProps {
  item: FoodListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StockAdjustDialog({ item, isOpen, onClose }: StockAdjustDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"ADD" | "REMOVE">("ADD");
  const [amount, setAmount] = useState<number | "">("");

  const handleClose = () => {
    setAmount("");
    setMode("ADD");
    onClose();
  };

  const handleSubmit = async () => {
    if (!item || !amount) return;

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.add({ title: "Error", description: "Please enter a valid positive number", type: "error" });
      return;
    }

    const adjustmentAmount = mode === "ADD" ? numericAmount : -numericAmount;

    if (mode === "REMOVE" && item.stock + adjustmentAmount < 0) {
      toast.add({ title: "Error", description: `Cannot remove more than current stock (${item.stock})`, type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/food/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjustStock", amount: adjustmentAmount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust stock");

      toast.add({ title: "Stock Adjusted", description: `${item.name} stock updated.`, type: "success" });
      queryClient.invalidateQueries({ queryKey: ["food"] });
      handleClose();
    } catch (error: any) {
      toast.add({ title: "Error", description: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[400px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Adjust Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center p-4 rounded-xl border border-surface-border bg-surface text-center space-y-1">
            <span className="text-sm font-medium text-surface-muted uppercase tracking-wider">{item.category}</span>
            <span className="text-lg font-bold text-white">{item.name}</span>
            <span className="text-sm font-semibold text-accent">Current Stock: {item.stock}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("ADD")}
              className={cn(
                "flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                mode === "ADD" ? "border-success bg-success/10 text-success" : "border-surface-border bg-surface text-surface-muted hover:border-success/50"
              )}
            >
              <PackagePlus className="h-5 w-5 mb-1" />
              <span className="text-sm font-semibold">Add Stock</span>
            </button>
            <button
              onClick={() => setMode("REMOVE")}
              className={cn(
                "flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                mode === "REMOVE" ? "border-danger bg-danger/10 text-danger" : "border-surface-border bg-surface text-surface-muted hover:border-danger/50"
              )}
            >
              <PackageMinus className="h-5 w-5 mb-1" />
              <span className="text-sm font-semibold">Remove Stock</span>
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-surface-muted">Quantity to {mode === "ADD" ? "Add" : "Remove"}</Label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                className="flex-1 rounded-lg border border-surface-border bg-surface px-4 py-2 text-white placeholder:text-surface-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand text-xl font-bold text-center"
              />
            </div>
          </div>
          
          {amount && (
             <div className="flex items-center justify-center gap-3 text-sm">
                <span className="text-surface-muted">New Stock:</span>
                <span className="font-bold text-white line-through opacity-50">{item.stock}</span>
                <ArrowRight className="h-4 w-4 text-brand" />
                <span className={cn(
                  "font-bold text-lg",
                  mode === "REMOVE" && item.stock - Number(amount) < 0 ? "text-danger" : "text-success"
                )}>
                  {mode === "ADD" ? item.stock + Number(amount) : item.stock - Number(amount)}
                </span>
             </div>
          )}
        </div>

        <DialogFooter className="border-t border-surface-border pt-4 gap-2 sm:justify-between">
           <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="bg-transparent border-surface-border text-white hover:bg-surface">
            Cancel
           </Button>
           <Button onClick={handleSubmit} disabled={isSubmitting || !amount} className="bg-brand hover:bg-brand-hover text-white font-semibold">
            {isSubmitting ? "Saving..." : "Confirm"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
