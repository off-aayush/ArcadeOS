"use client";

import { useState } from "react";
import { Discount } from "@prisma/client";
import { useDeleteDiscount, useUpdateDiscount } from "../hooks/use-discounts";
import { format } from "date-fns";
import { Tag, Percent, IndianRupee, ToggleLeft, ToggleRight, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Props {
  discounts: Discount[];
  onEdit: (discount: Discount) => void;
}

function DiscountTypeBadge({ type }: { type: Discount["type"] }) {
  if (type === "PERCENTAGE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
        <Percent className="h-3 w-3" /> Percentage
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-xs font-medium text-success">
      <IndianRupee className="h-3 w-3" /> Fixed Amount
    </span>
  );
}

export function DiscountTable({ discounts, onEdit }: Props) {
  const { mutateAsync: deleteDiscount } = useDeleteDiscount();
  const { mutateAsync: updateDiscount } = useUpdateDiscount();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleToggle = async (discount: Discount) => {
    try {
      await updateDiscount({ id: discount.id, data: { isActive: !discount.isActive } });
      toast.add({
        title: discount.isActive ? "Deactivated" : "Activated",
        description: `${discount.name} is now ${discount.isActive ? "inactive" : "active"}.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDiscount(id);
      toast.add({ title: "Deleted", description: "Discount removed successfully.", type: "success" });
      setConfirmDeleteId(null);
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  if (discounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border py-12 text-center">
        <Tag className="h-10 w-10 text-surface-muted mb-4" />
        <h3 className="text-lg font-semibold text-white">No discount templates</h3>
        <p className="text-sm text-surface-muted max-w-sm mt-1">
          Create reusable discount templates to apply during billing.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border bg-surface/50">
            <tr>
              <th className="px-6 py-4 font-medium text-surface-muted">Discount</th>
              <th className="px-6 py-4 font-medium text-surface-muted">Type</th>
              <th className="px-6 py-4 font-medium text-surface-muted">Value</th>
              <th className="px-6 py-4 font-medium text-surface-muted">Validity</th>
              <th className="px-6 py-4 font-medium text-surface-muted">Status</th>
              <th className="px-6 py-4 font-medium text-surface-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {discounts.map((d) => (
              <tr key={d.id} className={`group transition-colors hover:bg-surface-hover/50 ${!d.isActive ? "opacity-60" : ""}`}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{d.name}</p>
                    {d.code && (
                      <span className="inline-block mt-1 rounded-md bg-surface border border-surface-border px-1.5 py-0.5 font-mono text-[10px] text-surface-muted tracking-wider">
                        {d.code}
                      </span>
                    )}
                    {d.minBillAmount && (
                      <p className="text-[11px] text-surface-muted mt-1">Min bill: ₹{parseFloat(d.minBillAmount.toString()).toFixed(0)}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <DiscountTypeBadge type={d.type} />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-white">
                      {d.type === "PERCENTAGE"
                        ? `${parseFloat(d.value.toString()).toFixed(0)}%`
                        : `₹${parseFloat(d.value.toString()).toFixed(0)}`}
                    </p>
                    {d.maxAmount && d.type === "PERCENTAGE" && (
                      <p className="text-[11px] text-surface-muted">Max ₹{parseFloat(d.maxAmount.toString()).toFixed(0)}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-surface-muted text-xs">
                  {d.validFrom || d.validUntil ? (
                    <div>
                      {d.validFrom && <p>From: {format(new Date(d.validFrom), "dd MMM yyyy")}</p>}
                      {d.validUntil && <p>Until: {format(new Date(d.validUntil), "dd MMM yyyy")}</p>}
                    </div>
                  ) : (
                    <span className="text-surface-muted/50">No expiry</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggle(d)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-surface-hover text-sm"
                    title={d.isActive ? "Click to deactivate" : "Click to activate"}
                  >
                    {d.isActive ? (
                      <>
                        <ToggleRight className="h-5 w-5 text-success" />
                        <span className="text-success font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5 text-surface-muted" />
                        <span className="text-surface-muted">Inactive</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(d)}
                      className="rounded-lg p-1.5 text-surface-muted hover:text-white hover:bg-surface-hover transition-colors"
                      title="Edit discount"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {confirmDeleteId === d.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-warning">
                          <AlertTriangle className="h-3 w-3" /> Sure?
                        </span>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="rounded-lg px-2 py-1 text-[11px] font-medium bg-danger/20 text-danger hover:bg-danger/30 border border-danger/30 transition-colors disabled:opacity-50"
                        >
                          {deletingId === d.id ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-surface-muted hover:text-white transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(d.id)}
                        className="rounded-lg p-1.5 text-surface-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Delete discount"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
