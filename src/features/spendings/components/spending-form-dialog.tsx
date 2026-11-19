"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { SpendingRecord } from "../types";
import { spendingSchema } from "../validators";
import { PaymentMethod } from "@prisma/client";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS } from "../payment-methods";

type FormValues = { name: string; description: string; amount: string; paymentMethod: PaymentMethod | ""; spentAt: string };
type FormField = keyof FormValues;

function localDateTime(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function valuesFor(record: SpendingRecord | null): FormValues {
  return {
    name: record?.name ?? "",
    description: record?.description ?? "",
    amount: record ? String(record.amount) : "",
    paymentMethod: record?.paymentMethod ?? "",
    spentAt: localDateTime(record ? new Date(record.spentAt) : new Date()),
  };
}

export function SpendingFormDialog({ record, open, onClose, onSaved }: {
  record: SpendingRecord | null; open: boolean; onClose: () => void;
  onSaved: (spentAt: Date) => boolean;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<FormValues>(() => valuesFor(record));
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const baseline = useRef(values);
  const requestKey = useRef("");
  const dirty = Object.keys(values).some((key) =>
    values[key as FormField] !== baseline.current[key as FormField]);

  useEffect(() => {
    if (!open) return;
    const initial = valuesFor(record);
    baseline.current = initial;
    setValues(initial);
    setErrors({});
    setServerError("");
    requestKey.current = crypto.randomUUID();
  }, [open, record]);

  const change = (field: FormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
    if (!record) requestKey.current = crypto.randomUUID();
  };

  const requestClose = () => {
    if (saving) return;
    if (dirty && !window.confirm("Discard your unsaved spending changes?")) return;
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const localDate = new Date(values.spentAt);
    if (!values.spentAt || Number.isNaN(localDate.getTime()) ||
        localDateTime(localDate) !== values.spentAt) {
      setErrors((current) => ({ ...current, spentAt: "Enter a valid spending date and time" }));
      return;
    }
    const parsed = spendingSchema.safeParse({
      name: values.name,
      description: values.description,
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      spentAt: localDate.toISOString(),
    });
    if (!parsed.success) {
      const next: Partial<Record<FormField, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FormField;
        if (!next[field]) next[field] = issue.message;
      }
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(record ? `/api/spendings/${record.id}` : "/api/spendings", {
        method: record ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record ? parsed.data : { ...parsed.data, requestKey: requestKey.current }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Could not save spending");
      const rangeChanged = onSaved(localDate);
      await queryClient.invalidateQueries({
        queryKey: ["spendings"],
        refetchType: rangeChanged ? "none" : "active",
      });
      toast.add({
        title: record ? "Spending updated" : "Spending recorded",
        description: parsed.data.name,
        type: "success",
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save spending";
      setServerError(message);
      toast.add({ title: "Save failed", description: message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[520px] border-surface-border bg-surface-card text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{record ? "Edit Spending" : "Add Spending"}</DialogTitle>
          <p className="text-xs text-surface-muted">Record a lounge expense without changing inventory or billing.</p>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="spending-name">Name *</Label>
            <Input id="spending-name" value={values.name} onChange={(event) => change("name", event.target.value)}
              maxLength={120} aria-invalid={!!errors.name} className="border-surface-border bg-surface text-white"
              placeholder="e.g. New console" />
            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spending-description">Description</Label>
            <textarea id="spending-description" value={values.description}
              onChange={(event) => change("description", event.target.value)}
              maxLength={1000} rows={3} aria-invalid={!!errors.description}
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              placeholder="Optional details" />
            {errors.description && <p className="text-xs text-danger">{errors.description}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="spending-amount">Amount *</Label>
              <Input id="spending-amount" type="text" inputMode="decimal" value={values.amount}
                onChange={(event) => change("amount", event.target.value)}
                aria-invalid={!!errors.amount} className="border-surface-border bg-surface text-white"
                placeholder="0.00" />
              {errors.amount && <p className="text-xs text-danger">{errors.amount}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spending-payment-method">Payment Method *</Label>
              <select id="spending-payment-method" value={values.paymentMethod}
                onChange={(event) => change("paymentMethod", event.target.value)}
                aria-required="true" aria-invalid={!!errors.paymentMethod}
                className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
                <option value="">Select a method</option>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>
                ))}
              </select>
              {errors.paymentMethod && <p className="text-xs text-danger">{errors.paymentMethod}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spending-date">Spending date & time *</Label>
              <Input id="spending-date" type="datetime-local" value={values.spentAt}
                onChange={(event) => change("spentAt", event.target.value)}
                aria-invalid={!!errors.spentAt} className="border-surface-border bg-surface text-white"
              />
              {errors.spentAt && <p className="text-xs text-danger">{errors.spentAt}</p>}
            </div>
          </div>
          {serverError && <p role="alert" className="text-xs text-danger">{serverError}</p>}
          <DialogFooter className="border-surface-border bg-transparent">
            <button type="button" onClick={requestClose} disabled={saving}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm text-white hover:bg-surface-hover disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
              {saving ? "Saving..." : record ? "Save Changes" : "Add Spending"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
