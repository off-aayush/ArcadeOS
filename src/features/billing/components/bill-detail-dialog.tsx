"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "./payment-dialog";
import { ApplyDiscountDialog } from "./apply-discount-dialog";
import { AddAdjustmentDialog } from "./add-adjustment-dialog";
import { Tag, SlidersHorizontal, ShoppingCart, Search, UserPlus } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";
import { OrderDialog } from "@/features/sessions/components/order-dialog";
import { useParlourProfile } from "@/features/parlour-profile/hooks/use-parlour-profile";
import { CustomerListItem } from "@/features/customers/types";
import { CustomerCreateDialog } from "@/features/customers/components/customer-create-dialog";

type CustomerResult = { customers: CustomerListItem[]; total: number };

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
  const { data: profile } = useParlourProfile();
  const [bill, setBill] = useState<BillWithDetails | null>(initialBill ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  // ── Customer Search & Attach State ──
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCustomerCreateOpen, setIsCustomerCreateOpen] = useState(false);
  const [isAttachingCustomer, setIsAttachingCustomer] = useState(false);

  const handleSearchChange = (val: string) => {
    setCustomerSearch(val);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const { data: customerData, isLoading: isSearching } = useQuery<ApiResponse<CustomerResult>>({
    queryKey: ["customers-search", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "active" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`${API_ROUTES.customers}?${params}`);
      return res.json();
    },
    enabled: isOpen && bill !== null && !bill.customerId,
  });

  const customers = customerData?.success ? customerData.data.customers : [];

  const handleAttachCustomer = async (customerId: string) => {
    if (!bill) return;
    setIsAttachingCustomer(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/attach-customer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to attach customer");

      toast.add({ title: "Customer Attached", description: "Customer has been attached to the bill and session.", type: "success" });
      setBill(data.data);
      setCustomerSearch("");
      setDebouncedSearch("");
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsAttachingCustomer(false);
    }
  };

  const handleCustomerCreated = async (customer: CustomerListItem) => {
    setIsCustomerCreateOpen(false);
    await handleAttachCustomer(customer.id);
  };

  // For FOOD/DRINK items in a session-linked bill, we allow qty edit. For standalone bills (no session), editing is disabled to avoid double-deductions.
  const canEditOrderItems =
    bill !== null && bill.session !== null && bill.status !== "PAID" && bill.status !== "VOIDED";

  const handleUpdateOrderQty = async (billItemId: string, newQty: number) => {
    if (!bill || !bill.session) return;
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

  const handleRemoveBillItem = async (billItemId: string) => {
    if (!bill) return;
    const endpoint = `/api/bills/${bill.id}/items/${billItemId}`;
    setLoadingItems((p) => ({ ...p, [billItemId]: true }));
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to remove item");
      }
      setBill(data.data);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.add({
        title: "Item Removed",
        description: "The bill has been updated.",
        type: "success",
      });
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
    setGenerateError(null);
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
      setGenerateError(null);
      // Invalidate sessions list so the bill column updates
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.add({
        title: "Invoice Generated",
        description: `Bill ${data.data.billNumber} created.`,
        type: "success",
      });
    } catch (err: any) {
      // Do NOT close the dialog on error — keep it open so the user can see
      // what went wrong and retry if needed.
      const msg = err.message || "Failed to generate invoice";
      setGenerateError(msg);
      console.error("[BillDetailDialog] Invoice generation failed:", msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger generation as soon as the dialog opens (if needed)
  useEffect(() => {
    if (isOpen) {
      if (initialBill) {
        setBill(initialBill);
        setGenerateError(null);
      } else if (sessionId && !bill) {
        handleGenerate();
      }
    } else {
      // Reset state when dialog closes
      setBill(null);
      setGenerateError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialBill, sessionId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-zone")?.innerHTML;
    if (!printContent) return;

    // Create a hidden iframe for perfectly isolated printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Copy Tailwind stylesheets from the parent document
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map(node => node.outerHTML)
      .join("");

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Invoice - ${bill?.billNumber || ""}</title>
          ${styles}
          <style>
            /* Reset dark mode to white paper */
            body { 
              background: white !important; 
              color: black !important; 
              padding: 24px; 
              font-family: "Inter", system-ui, -apple-system, sans-serif;
            }
            /* Override Tailwind dark classes */
            .text-white { color: black !important; }
            .bg-surface, .bg-surface-card { background-color: white !important; }
            .border-surface-border, .border-b, .border-t { border-color: #e5e7eb !important; }
            .text-surface-muted { color: #6b7280 !important; }
            .text-brand { color: #4f46e5 !important; }
            .bg-surface\\/50 { background-color: transparent !important; }
            /* Hide print:hidden elements explicitly */
            .print\\:hidden { display: none !important; }
            /* Strip max heights and scrollbars to allow natural pagination */
            * {
               max-height: none !important;
               overflow: visible !important;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    doc.close();

    // Give it a brief moment to process the DOM and styles, then print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Clean up iframe after print dialog resolves
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const session = bill?.session;
  const isStandalone = bill !== null && !bill.session;
  // Customer from session if session-linked, from bill.customer if standalone
  const customer = session?.customer ?? bill?.customer;
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
      <DialogContent className="sm:max-w-[700px] bg-surface-card border-surface-border text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="print:hidden p-5 pb-4 border-b border-surface-border bg-surface/50">
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

        {/* ── Error state ────────────────────────────────────────────────── */}
        {!isGenerating && generateError && !bill && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 px-6">
            <div className="rounded-full bg-danger/15 border border-danger/30 p-4">
              <Receipt className="h-8 w-8 text-danger" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-white">Invoice Generation Failed</p>
              <p className="text-xs text-surface-muted max-w-sm">{generateError}</p>
            </div>
            <Button
              onClick={handleGenerate}
              className="bg-brand hover:bg-brand/80 text-white font-semibold gap-2"
            >
              <Loader2 className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* ── Bill content ──────────────────────────────────────────────── */}
        {!isGenerating && bill && (
          <div id="invoice-print-zone" className="space-y-5 p-5 max-h-[70vh] overflow-y-auto">

            {/* ── Business Header (Parlour Profile) ─────────────────────── */}
            <div className="border-b border-surface-border pb-4 text-center space-y-0.5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {profile?.name ?? "My Arcade"}
              </h1>
              {profile?.tagline && (
                <p className="text-xs text-surface-muted italic">{profile.tagline}</p>
              )}
              {/* Address line */}
              {(profile?.address || profile?.city || profile?.state || profile?.pincode) && (
                <p className="text-xs text-surface-muted flex items-center justify-center gap-1 flex-wrap">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[profile?.address, profile?.city, profile?.state, profile?.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {/* Contact line */}
              {(profile?.phone || profile?.email) && (
                <p className="text-xs text-surface-muted flex items-center justify-center gap-3 flex-wrap">
                  {profile?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />{profile.phone}
                    </span>
                  )}
                  {profile?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />{profile.email}
                    </span>
                  )}
                </p>
              )}
              {/* GSTIN */}
              {profile?.gstin && (
                <p className="text-xs text-surface-muted font-mono">
                  GSTIN: {profile.gstin}
                </p>
              )}
            </div>

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

            {/* Session / Sale Context */}
            <div className="rounded-lg bg-surface p-4 border border-surface-border/50 space-y-3">
              <p className="text-xs font-semibold text-surface-muted uppercase tracking-wider">
                {isStandalone ? "Sale Details" : "Session Details"}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {/* Station (session-linked only) */}
                {session && (
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-brand shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-surface-muted">Station</span>
                      <span className="font-medium text-white">
                        {session.station.name}
                      </span>
                      <span className="text-xs text-surface-muted">
                        {STATION_TYPE_LABELS[
                          session.station.type as keyof typeof STATION_TYPE_LABELS
                        ] ?? session.station.type}
                      </span>
                    </div>
                  </div>
                )}
                {/* Standalone sale label */}
                {isStandalone && (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-brand shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-surface-muted">Type</span>
                      <span className="font-medium text-white">Inventory Sale</span>
                      <span className="text-xs text-surface-muted">No session required</span>
                    </div>
                  </div>
                )}
                {/* Customer */}
                {customer ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-surface-muted shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-surface-muted">Customer</span>
                      <span className="font-medium text-white">{customer.name}</span>
                      {"phone" in customer && (customer as any).phone && (
                        <span className="text-xs text-surface-muted">{(customer as any).phone}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 space-y-2 mt-2 pt-3 border-t border-surface-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-surface-muted uppercase tracking-wider">Customer (Optional)</span>
                    </div>
                    {bill && bill.status !== "PAID" && bill.status !== "VOIDED" ? (
                      <div className="space-y-1 relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
                          <input
                            type="text"
                            placeholder="Search by name, phone..."
                            value={customerSearch}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            disabled={isAttachingCustomer}
                            className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
                          />
                        </div>
                        {customerSearch && (
                          <div className="absolute z-50 w-full mt-1 rounded-lg border border-surface-border bg-surface-card max-h-40 overflow-y-auto shadow-xl divide-y divide-surface-border/50">
                            {isSearching ? (
                              <p className="px-4 py-3 text-sm text-surface-muted">Searching...</p>
                            ) : customers.length === 0 ? (
                              <div className="px-4 py-4 text-center space-y-3">
                                <p className="text-sm text-surface-muted">No customers found</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsCustomerCreateOpen(true)}
                                  className="border-brand/40 text-brand hover:bg-brand/10 w-full"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Register New Customer
                                </Button>
                              </div>
                            ) : (
                              <>
                                {customers.map((c: CustomerListItem) => (
                                  <button
                                    key={c.id}
                                    onClick={() => handleAttachCustomer(c.id)}
                                    disabled={isAttachingCustomer}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-surface-hover disabled:opacity-50"
                                  >
                                    <div>
                                      <span className="text-sm font-medium text-white block">{c.name}</span>
                                      <span className="text-xs text-surface-muted">{c.phone || c.email || ""}</span>
                                    </div>
                                    {isAttachingCustomer && <Loader2 className="h-3.5 w-3.5 animate-spin text-surface-muted" />}
                                  </button>
                                ))}
                                <div className="p-2 border-t border-surface-border/50 bg-surface/30">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCustomerCreateOpen(true)}
                                    className="text-brand hover:text-brand/80 hover:bg-brand/10 w-full justify-start"
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Register New Customer
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-surface-muted block">Walk-in</span>
                    )}
                  </div>
                )}
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
                {/* Duration (session-linked only) */}
                {session && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-surface-muted shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-surface-muted">Duration</span>
                      <span className="font-mono font-medium text-white">
                        {formatDuration(durationMs)}
                      </span>
                      {(session.totalPausedMs ?? 0) > 0 && (
                        <span className="text-xs text-warning/80">
                          ({formatDuration(session.totalPausedMs)} paused)
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {/* Players (session-linked only) */}
                {session && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-surface-muted shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-surface-muted">Players</span>
                      <span className="font-medium text-white">
                        {session.playerCount ?? 1} {(session.playerCount ?? 1) === 1 ? 'Player' : 'Players'}
                      </span>
                    </div>
                  </div>
                )}
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
                            ) : (item.type === "DISCOUNT" || item.type === "MANUAL_CREDIT" || item.type === "MANUAL_CHARGE") && canEditOrderItems ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="mr-2 text-xs font-bold text-white">{qty}</span>
                                <button
                                  onClick={() => handleRemoveBillItem(item.id)}
                                  disabled={isMutating}
                                  className="h-5 w-5 rounded border border-surface-border bg-surface text-white hover:bg-surface-hover transition-colors flex items-center justify-center disabled:opacity-40"
                                >
                                  {isMutating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5 text-danger" />}
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

            {/* ── Receipt Footer (Parlour Profile) ─────────────────────── */}
            {profile?.receiptFooter && (
              <div className="border-t border-surface-border pt-3 text-center">
                <p className="text-xs text-surface-muted whitespace-pre-line">{profile.receiptFooter}</p>
              </div>
            )}

          </div>
        )}

        <DialogFooter className="print:hidden m-1 p-4 border-t border-surface-border bg-surface/50 gap-2 sm:justify-between">
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
                {bill.status === "PENDING" && (
                  <Button
                    variant="outline"
                    onClick={() => setIsOrderDialogOpen(true)}
                    className="border-surface-border text-white hover:bg-surface hover:text-brand gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add Item
                  </Button>
                )}
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
            queryClient.invalidateQueries({ queryKey: ["customers"] });
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

      {/* Order Dialog */}
      {bill && bill.session && (
        <OrderDialog
          sessionId={bill.session.id}
          sessionLabel={bill.session.customer?.name ?? bill.session.station.name}
          isOpen={isOrderDialogOpen}
          onClose={() => {
            setIsOrderDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["bills"] });
            // Re-fetch the bill to update local state with new items
            fetch(`/api/bills/${bill.id}`)
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setBill(data.data);
                }
              })
              .catch(console.error);
          }}
        />
      )}

      {/* Customer Create Dialog */}
      <CustomerCreateDialog
        isOpen={isCustomerCreateOpen}
        onClose={() => setIsCustomerCreateOpen(false)}
        onSuccess={handleCustomerCreated}
      />
    </Dialog>
  );
}
