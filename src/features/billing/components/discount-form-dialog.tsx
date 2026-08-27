"use client";

import { useState, useEffect } from "react";
import { Discount, DiscountType } from "@prisma/client";
import { useCreateDiscount, useUpdateDiscount } from "../hooks/use-discounts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Tag, Percent, IndianRupee } from "lucide-react";

interface Props {
  discount?: Discount | null;
  isOpen: boolean;
  onClose: () => void;
}

type FormState = {
  name: string;
  code: string;
  type: DiscountType;
  value: string;
  maxAmount: string;
  minBillAmount: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

const defaultForm: FormState = {
  name: "",
  code: "",
  type: "PERCENTAGE",
  value: "",
  maxAmount: "",
  minBillAmount: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

function toLocalDatetimeValue(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  // Format as YYYY-MM-DDTHH:MM for datetime-local input
  return d.toISOString().slice(0, 16);
}

export function DiscountFormDialog({ discount, isOpen, onClose }: Props) {
  const { mutateAsync: createDiscount, isPending: isCreating } = useCreateDiscount();
  const { mutateAsync: updateDiscount, isPending: isUpdating } = useUpdateDiscount();
  const isPending = isCreating || isUpdating;

  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    if (isOpen) {
      if (discount) {
        setForm({
          name: discount.name,
          code: discount.code || "",
          type: discount.type,
          value: discount.value.toString(),
          maxAmount: discount.maxAmount?.toString() || "",
          minBillAmount: discount.minBillAmount?.toString() || "",
          validFrom: toLocalDatetimeValue(discount.validFrom),
          validUntil: toLocalDatetimeValue(discount.validUntil),
          isActive: discount.isActive,
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [discount, isOpen]);

  const handleClose = () => {
    setForm(defaultForm);
    onClose();
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    code: form.code.trim() || null,
    type: form.type,
    value: parseFloat(form.value),
    maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : null,
    minBillAmount: form.minBillAmount ? parseFloat(form.minBillAmount) : null,
    validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
    validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
    isActive: form.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.add({ title: "Error", description: "Name is required", type: "error" });
      return;
    }
    if (!form.value || isNaN(parseFloat(form.value)) || parseFloat(form.value) <= 0) {
      toast.add({ title: "Error", description: "A valid positive value is required", type: "error" });
      return;
    }
    if (form.type === "PERCENTAGE" && parseFloat(form.value) > 100) {
      toast.add({ title: "Error", description: "Percentage cannot exceed 100%", type: "error" });
      return;
    }

    try {
      const payload = buildPayload();
      if (discount) {
        await updateDiscount({ id: discount.id, data: payload });
        toast.add({ title: "Success", description: "Discount updated successfully", type: "success" });
      } else {
        await createDiscount(payload);
        toast.add({ title: "Success", description: "Discount created successfully", type: "success" });
      }
      handleClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message || "Failed to save discount", type: "error" });
    }
  };

  const isEditing = !!discount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Tag className="h-5 w-5 text-brand" />
            {isEditing ? "Edit Discount" : "Create Discount"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="disc-name">Name</Label>
            <Input
              id="disc-name"
              placeholder="e.g. Weekend Special"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="disc-code">
              Code <span className="text-surface-muted">(optional — used for quick apply)</span>
            </Label>
            <Input
              id="disc-code"
              placeholder="e.g. WKND10"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              maxLength={20}
              className="font-mono uppercase"
            />
          </div>

          {/* Type + Value row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as DiscountType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">
                    <span className="flex items-center gap-2">
                      <Percent className="h-3.5 w-3.5" /> Percentage
                    </span>
                  </SelectItem>
                  <SelectItem value="FIXED_AMOUNT">
                    <span className="flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5" /> Fixed Amount
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disc-value">
                Value ({form.type === "PERCENTAGE" ? "%" : "₹"})
              </Label>
              <Input
                id="disc-value"
                type="number"
                min="0.01"
                step="0.01"
                max={form.type === "PERCENTAGE" ? "100" : undefined}
                placeholder={form.type === "PERCENTAGE" ? "e.g. 10" : "e.g. 50"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
          </div>

          {/* Max Amount + Min Bill Amount row */}
          <div className="grid grid-cols-2 gap-4">
            {form.type === "PERCENTAGE" && (
              <div className="space-y-1.5">
                <Label htmlFor="disc-max">
                  Max Discount ₹ <span className="text-surface-muted">(optional cap)</span>
                </Label>
                <Input
                  id="disc-max"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 200"
                  value={form.maxAmount}
                  onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="disc-min">
                Min Bill ₹ <span className="text-surface-muted">(optional)</span>
              </Label>
              <Input
                id="disc-min"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100"
                value={form.minBillAmount}
                onChange={(e) => setForm({ ...form, minBillAmount: e.target.value })}
              />
            </div>
          </div>

          {/* Valid From / Until */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="disc-from">Valid From <span className="text-surface-muted">(optional)</span></Label>
              <Input
                id="disc-from"
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disc-until">Valid Until <span className="text-surface-muted">(optional)</span></Label>
              <Input
                id="disc-until"
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface/50 px-4 py-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.isActive ? "bg-brand" : "bg-surface-border"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.isActive ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-white">
                {form.isActive ? "Active" : "Inactive"}
              </p>
              <p className="text-xs text-surface-muted">
                {form.isActive ? "Discount is available for application to bills" : "Discount is hidden from billing flow"}
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (isEditing ? "Saving…" : "Creating…") : (isEditing ? "Save Changes" : "Create Discount")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
