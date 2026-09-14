"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { ApiResponse } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { API_ROUTES } from "@/lib/constants";
import { CustomerListItem } from "@/features/customers/types";
import { FoodListItem } from "@/features/food/types";
import { BillDetailDialog } from "@/features/billing/components/bill-detail-dialog";
import { BillWithDetails } from "@/features/billing/types";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  UserCircle,
  Package,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  foodItem: FoodListItem;
  quantity: number;
}

interface NewStandaloneSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewStandaloneSaleDialog({ isOpen, onClose }: NewStandaloneSaleDialogProps) {
  const queryClient = useQueryClient();

  // Steps: "customer" | "items" | "review"
  const [step, setStep] = useState<"customer" | "items" | "review">("customer");

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);

  // Item selection
  const [itemSearch, setItemSearch] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBill, setCreatedBill] = useState<BillWithDetails | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);

  const handleSearchCustomer = (val: string) => {
    setCustomerSearch(val);
    clearTimeout((handleSearchCustomer as any)._t);
    (handleSearchCustomer as any)._t = setTimeout(() => setDebouncedCustomerSearch(val), 350);
  };

  const handleSearchItem = (val: string) => {
    setItemSearch(val);
    clearTimeout((handleSearchItem as any)._t);
    (handleSearchItem as any)._t = setTimeout(() => setDebouncedItemSearch(val), 350);
  };

  const { data: customerData, isLoading: isSearchingCustomers } = useQuery<ApiResponse<{ customers: CustomerListItem[]; total: number }>>({
    queryKey: ["customers-sale-search", debouncedCustomerSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "active" });
      if (debouncedCustomerSearch) params.set("search", debouncedCustomerSearch);
      const res = await fetch(`${API_ROUTES.customers}?${params}`);
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: itemData, isLoading: isSearchingItems } = useQuery<ApiResponse<{ items: FoodListItem[]; total: number }>>({
    queryKey: ["food-sale-search", debouncedItemSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ inStock: "true", category: "ALL" });
      if (debouncedItemSearch) params.set("search", debouncedItemSearch);
      const res = await fetch(`/api/food?${params}`);
      return res.json();
    },
    enabled: isOpen && step === "items",
  });

  const customers = customerData?.success ? customerData.data.customers : [];
  const foodItems = itemData?.success ? itemData.data.items : [];

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.foodItem.price) * c.quantity, 0);

  const addToCart = (item: FoodListItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.foodItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.foodItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { foodItem: item, quantity: 1 }];
    });
  };

  const updateQty = (foodItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.foodItem.id !== foodItemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.foodItem.id === foodItemId ? { ...c, quantity: newQty } : c))
      );
    }
  };

  const handleReset = () => {
    setStep("customer");
    setCustomerSearch("");
    setDebouncedCustomerSearch("");
    setSelectedCustomer(null);
    setItemSearch("");
    setDebouncedItemSearch("");
    setCart([]);
    setCreatedBill(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer?.id || null,
          items: cart.map((c) => ({
            foodItemId: c.foodItem.id,
            quantity: c.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to create bill");
      }

      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["food"] });

      // Close the sale dialog and open the bill
      handleReset();
      onClose();
      setCreatedBill(data.data);
      setIsBillDialogOpen(true);

      toast.add({
        title: "Sale Created",
        description: `Bill ${data.data.billNumber} created successfully.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[520px] bg-surface-card border-surface-border text-white p-0 gap-0">
          <DialogHeader className="p-5 pb-4 border-b border-surface-border bg-surface/50">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <ShoppingCart className="h-5 w-5 text-brand" />
              New Inventory Sale
            </DialogTitle>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-2 text-xs text-surface-muted">
              {(["customer", "items", "review"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-surface-border">›</span>}
                  <span className={cn(
                    "capitalize",
                    step === s ? "text-brand font-semibold" : "text-surface-muted"
                  )}>
                    {s === "customer" ? "Customer" : s === "items" ? "Items" : "Review"}
                  </span>
                </div>
              ))}
            </div>
          </DialogHeader>

          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
            {/* ── STEP 1: Customer ─────────────────────────────────────────────── */}
            {step === "customer" && (
              <div className="space-y-3">
                <p className="text-sm text-surface-muted">Select a customer or skip for a walk-in sale.</p>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{selectedCustomer.name || "Guest"}</p>
                      {selectedCustomer.phone && <p className="text-xs text-surface-muted">{selectedCustomer.phone}</p>}
                    </div>
                    <button
                      onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setDebouncedCustomerSearch(""); }}
                      className="text-xs text-danger hover:text-danger/80 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
                      <input
                        type="text"
                        placeholder="Search customer by name or phone…"
                        value={customerSearch}
                        onChange={(e) => handleSearchCustomer(e.target.value)}
                        className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none"
                      />
                    </div>
                    {customerSearch && (
                      <div className="rounded-lg border border-surface-border bg-surface-card max-h-48 overflow-y-auto divide-y divide-surface-border/50">
                        {isSearchingCustomers ? (
                          <p className="px-4 py-3 text-sm text-surface-muted">Searching…</p>
                        ) : customers.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-center text-surface-muted">No customers found.</p>
                        ) : (
                          customers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setDebouncedCustomerSearch(""); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors"
                            >
                              <UserCircle className="h-5 w-5 text-brand shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-white block">{c.name || "Guest"}</span>
                                <span className="text-xs text-surface-muted">{c.phone || c.email || "No contact"}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Items ──────────────────────────────────────────────── */}
            {step === "items" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
                  <input
                    type="text"
                    placeholder="Search inventory items…"
                    value={itemSearch}
                    onChange={(e) => handleSearchItem(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none"
                  />
                </div>

                {/* Available Items */}
                <div className="rounded-lg border border-surface-border overflow-hidden max-h-48 overflow-y-auto">
                  {isSearchingItems ? (
                    <p className="px-4 py-3 text-sm text-surface-muted">Loading items…</p>
                  ) : foodItems.length === 0 ? (
                    <p className="px-4 py-4 text-center text-sm text-surface-muted">No items found or no stock available.</p>
                  ) : (
                    foodItems.map((item) => {
                      const cartItem = cart.find((c) => c.foodItem.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border/50 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-brand shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-white">{item.name}</p>
                              <p className="text-xs text-surface-muted">{formatCurrency(Number(item.price))} · Stock: {item.stock}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {cartItem ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQty(item.id, cartItem.quantity - 1)}
                                  className="h-6 w-6 rounded-md bg-surface border border-surface-border hover:bg-surface-hover text-white flex items-center justify-center"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm font-mono text-white w-6 text-center">{cartItem.quantity}</span>
                                <button
                                  onClick={() => {
                                    if (cartItem.quantity < item.stock) updateQty(item.id, cartItem.quantity + 1);
                                    else toast.add({ title: "Stock Limit", description: `Only ${item.stock} available.`, type: "error" });
                                  }}
                                  className="h-6 w-6 rounded-md bg-surface border border-surface-border hover:bg-surface-hover text-white flex items-center justify-center"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                disabled={item.stock === 0}
                                className="px-3 py-1 rounded-md bg-brand/10 border border-brand/30 text-brand text-xs font-semibold hover:bg-brand/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-3 w-3 inline mr-1" />
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Cart Summary */}
                {cart.length > 0 && (
                  <div className="rounded-lg border border-surface-border/50 bg-surface overflow-hidden">
                    <p className="px-4 py-2 text-xs font-bold text-surface-muted uppercase tracking-wider border-b border-surface-border/50">Cart ({cart.length} item{cart.length > 1 ? "s" : ""})</p>
                    {cart.map((c) => (
                      <div key={c.foodItem.id} className="flex items-center justify-between px-4 py-2 border-b border-surface-border/30 last:border-0">
                        <span className="text-sm text-white">{c.foodItem.name} × {c.quantity}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-white">{formatCurrency(Number(c.foodItem.price) * c.quantity)}</span>
                          <button onClick={() => updateQty(c.foodItem.id, 0)} className="text-danger hover:text-danger/80">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-2.5 flex justify-between items-center bg-surface-card/50">
                      <span className="text-sm font-semibold text-white">Total</span>
                      <span className="font-mono font-bold text-white">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Review ────────────────────────────────────────────── */}
            {step === "review" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-surface border border-surface-border/50 p-4 space-y-2">
                  <p className="text-xs font-bold text-surface-muted uppercase tracking-wider">Customer</p>
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-brand" />
                    <span className="font-medium text-white">{selectedCustomer?.name || "Walk-in"}</span>
                    {selectedCustomer?.phone && <span className="text-xs text-surface-muted">({selectedCustomer.phone})</span>}
                  </div>
                </div>

                <div className="rounded-lg border border-surface-border overflow-hidden">
                  <p className="px-4 py-2 text-xs font-bold text-surface-muted uppercase tracking-wider border-b border-surface-border">Items</p>
                  {cart.map((c) => (
                    <div key={c.foodItem.id} className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{c.foodItem.name}</p>
                        <p className="text-xs text-surface-muted">{c.quantity} × {formatCurrency(Number(c.foodItem.price))}</p>
                      </div>
                      <span className="font-mono text-sm text-white">{formatCurrency(Number(c.foodItem.price) * c.quantity)}</span>
                    </div>
                  ))}
                  <div className="px-4 py-3 flex justify-between items-center bg-surface-card/50 border-t border-surface-border">
                    <span className="text-sm font-bold text-white">Grand Total</span>
                    <span className="font-mono font-bold text-lg text-brand">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-brand/10 border border-brand/20 p-3 flex items-center gap-2 text-sm text-brand">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Stock will be deducted when you confirm.
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-5 border-t border-surface-border gap-2">
            {step === "customer" && (
              <>
                <Button variant="outline" onClick={handleClose} className="bg-transparent border-surface-border hover:bg-surface text-white">
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep("items")}
                  className="bg-brand hover:bg-brand/80 text-white font-semibold"
                >
                  {selectedCustomer ? `Continue as ${selectedCustomer.name || "Guest"}` : "Continue as Walk-in"}
                </Button>
              </>
            )}
            {step === "items" && (
              <>
                <Button variant="outline" onClick={() => setStep("customer")} className="bg-transparent border-surface-border hover:bg-surface text-white">
                  Back
                </Button>
                <Button
                  onClick={() => setStep("review")}
                  disabled={cart.length === 0}
                  className="bg-brand hover:bg-brand/80 text-white font-semibold"
                >
                  Review ({cart.length} item{cart.length !== 1 ? "s" : ""})
                </Button>
              </>
            )}
            {step === "review" && (
              <>
                <Button variant="outline" onClick={() => setStep("items")} disabled={isSubmitting} className="bg-transparent border-surface-border hover:bg-surface text-white">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cart.length === 0}
                  className="bg-success hover:bg-success/80 text-white font-semibold"
                >
                  {isSubmitting ? "Processing…" : `Confirm Sale · ${formatCurrency(cartTotal)}`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show bill detail after successful creation */}
      {createdBill && (
        <BillDetailDialog
          bill={createdBill}
          isOpen={isBillDialogOpen}
          onClose={() => {
            setIsBillDialogOpen(false);
            setCreatedBill(null);
          }}
        />
      )}
    </>
  );
}
