"use client";

import { useState } from "react";
import { Discount } from "@prisma/client";
import { useAllDiscounts } from "@/features/billing/hooks/use-discounts";
import { DiscountTable } from "@/features/billing/components/discount-table";
import { DiscountFormDialog } from "@/features/billing/components/discount-form-dialog";
import { Loader2, Tag } from "lucide-react";

export default function DiscountsSettingsPage() {
  const { data: discounts = [], isLoading, error } = useAllDiscounts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Separate active / inactive for summary
  const active = discounts.filter((d) => d.isActive);
  const inactive = discounts.filter((d) => !d.isActive);

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Discount Templates</h2>
          <p className="text-sm text-surface-muted mt-1">
            Create reusable discount templates that can be applied to bills during checkout.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-brand hover:bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow-brand transition-all active:scale-95"
        >
          + New Discount
        </button>
      </div>

      {/* Summary Cards */}
      {discounts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-surface-border bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-brand" />
              <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">Total</p>
            </div>
            <p className="text-2xl font-bold text-white">{discounts.length}</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-success" />
              <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">Active</p>
            </div>
            <p className="text-2xl font-bold text-success">{active.length}</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-surface-muted" />
              <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">Inactive</p>
            </div>
            <p className="text-2xl font-bold text-surface-muted">{inactive.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center text-danger">
          Failed to load discounts. Please try again.
        </div>
      ) : (
        <DiscountTable discounts={discounts} onEdit={setEditingDiscount} />
      )}

      {/* Create Dialog */}
      <DiscountFormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Edit Dialog */}
      <DiscountFormDialog
        discount={editingDiscount}
        isOpen={!!editingDiscount}
        onClose={() => setEditingDiscount(null)}
      />
    </div>
  );
}
