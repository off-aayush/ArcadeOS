"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { API_ROUTES, CURRENCY_SYMBOL } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { FoodListItem } from "@/features/food/types";
import { BillWithDetails } from "@/features/billing/types";
import { ApiResponse } from "@/types";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Package,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FoodCategory } from "@prisma/client";

interface OrderDialogProps {
  sessionId: string;
  sessionLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<FoodCategory | "ALL", string> = {
  ALL: "All",
  SNACKS: "Snacks",
  MEALS: "Meals",
  BEVERAGES_HOT: "Hot Drinks",
  BEVERAGES_COLD: "Cold Drinks",
  DESSERTS: "Desserts",
  COMBOS: "Combos",
};

type FoodResult = { items: FoodListItem[]; total: number };

export function OrderDialog({ sessionId, sessionLabel, isOpen, onClose }: OrderDialogProps) {
  const queryClient = useQueryClient();

  // Current draft bill state
  const [bill, setBill] = useState<BillWithDetails | null>(null);
  const [isBillLoading, setIsBillLoading] = useState(false);

  // Product catalogue
  const [products, setProducts] = useState<FoodListItem[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FoodCategory | "ALL">("ALL");

  // Per-product quantity selectors (before adding to order)
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Mutation loading
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  // Fetch draft bill
  const fetchBill = async () => {
    setIsBillLoading(true);
    try {
      const res = await fetch(API_ROUTES.orders(sessionId));
      const data: ApiResponse<BillWithDetails | null> = await res.json();
      if (data.success) setBill(data.data);
    } catch {
      // ignore
    } finally {
      setIsBillLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    setIsProductsLoading(true);
    try {
      const params = new URLSearchParams({ inStock: "IN_STOCK", pageSize: "100" });
      if (search) params.set("search", search);
      if (category !== "ALL") params.set("category", category);
      const res = await fetch(`${API_ROUTES.food}?${params}`);
      const data: ApiResponse<FoodResult> = await res.json();
      if (data.success) setProducts(data.data.items);
    } catch {
      // ignore
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBill();
      fetchProducts();
    } else {
      setBill(null);
      setSearch("");
      setCategory("ALL");
      setQuantities({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchProducts();
  }, [search, category]);

  // Add item to session order
  const handleAdd = async (product: FoodListItem) => {
    const qty = quantities[product.id] ?? 1;
    setLoadingItems((p) => ({ ...p, [product.id]: true }));
    try {
      const res = await fetch(API_ROUTES.orders(sessionId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodItemId: product.id, quantity: qty }),
      });
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to add item");
      }
      setBill(data.data);
      // Refresh stock display
      fetchProducts();
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.add({ title: "Added", description: `${qty}x ${product.name} added to order.`, type: "success" });
      setQuantities((p) => ({ ...p, [product.id]: 1 }));
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setLoadingItems((p) => ({ ...p, [product.id]: false }));
    }
  };

  // Update qty on existing bill item
  const handleUpdateQty = async (billItemId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(billItemId);
      return;
    }
    setLoadingItems((p) => ({ ...p, [billItemId]: true }));
    try {
      const res = await fetch(API_ROUTES.orderItem(sessionId, billItemId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to update");
      }
      setBill(data.data);
      fetchProducts();
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setLoadingItems((p) => ({ ...p, [billItemId]: false }));
    }
  };

  // Remove bill item
  const handleRemove = async (billItemId: string) => {
    setLoadingItems((p) => ({ ...p, [billItemId]: true }));
    try {
      const res = await fetch(API_ROUTES.orderItem(sessionId, billItemId), {
        method: "DELETE",
      });
      const data: ApiResponse<BillWithDetails> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to remove");
      }
      setBill(data.data);
      fetchProducts();
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      toast.add({ title: "Removed", description: "Item removed from order.", type: "success" });
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setLoadingItems((p) => ({ ...p, [billItemId]: false }));
    }
  };

  const foodOrderItems = bill?.items.filter(
    (i) => i.type === "FOOD" || i.type === "DRINK"
  ) ?? [];

  const orderTotal = foodOrderItems.reduce(
    (sum, i) => sum + Number(i.totalPrice),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[860px] bg-surface-card border-surface-border text-white p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 pb-4 border-b border-surface-border bg-surface/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ShoppingCart className="h-5 w-5 text-brand" />
            Add Items — <span className="text-brand">{sessionLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* ── Left: Product Catalogue ──────────────────────────────────── */}
          <div className="flex-1 flex flex-col border-r border-surface-border min-h-0">
            {/* Search + Category filter */}
            <div className="p-4 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {/* Category tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(CATEGORY_LABELS) as (FoodCategory | "ALL")[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                      category === cat
                        ? "bg-brand text-white"
                        : "bg-surface border border-surface-border text-surface-muted hover:text-white hover:border-surface-muted"
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto p-4 pt-0">
              {isProductsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-surface-muted" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-surface-muted">
                  <Package className="h-8 w-8" />
                  <p className="text-sm">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => {
                    const qty = quantities[product.id] ?? 1;
                    const isAdding = !!loadingItems[product.id];
                    const stockLow = product.stock <= product.minStock;
                    return (
                      <div
                        key={product.id}
                        className="rounded-xl border border-surface-border bg-surface p-3 flex flex-col gap-2 hover:border-brand/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                            <p className="text-xs text-surface-muted">{CATEGORY_LABELS[product.category]}</p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full",
                              product.stock === 0
                                ? "bg-danger/20 text-danger border border-danger/30"
                                : stockLow
                                  ? "bg-warning/20 text-warning border border-warning/30"
                                  : "bg-success/15 text-success border border-success/30"
                            )}
                          >
                            {product.stock === 0 ? "Out" : `${product.stock} left`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-auto">
                          <span className="font-mono font-bold text-brand text-sm">
                            {formatCurrency(Number(product.price))}
                          </span>
                          {product.stock > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {/* Qty stepper */}
                              <button
                                onClick={() => setQuantities((p) => ({ ...p, [product.id]: Math.max(1, qty - 1) }))}
                                className="h-6 w-6 rounded-md border border-surface-border bg-surface text-white hover:bg-surface-hover transition-colors text-sm font-bold flex items-center justify-center"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-white">{qty}</span>
                              <button
                                onClick={() => setQuantities((p) => ({ ...p, [product.id]: Math.min(product.stock, qty + 1) }))}
                                className="h-6 w-6 rounded-md border border-surface-border bg-surface text-white hover:bg-surface-hover transition-colors text-sm font-bold flex items-center justify-center"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleAdd(product)}
                                disabled={isAdding}
                                className="ml-1 px-3 py-1 rounded-lg bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1"
                              >
                                {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                Add
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-danger font-medium">Out of stock</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Current Order ──────────────────────────────────────── */}
          <div className="w-[300px] shrink-0 flex flex-col min-h-0">
            <div className="p-4 border-b border-surface-border shrink-0">
              <p className="text-xs font-bold text-surface-muted uppercase tracking-wider">
                Current Order
              </p>
            </div>

            {isBillLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-surface-muted" />
              </div>
            ) : foodOrderItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-surface-muted p-4">
                <UtensilsCrossed className="h-8 w-8" />
                <p className="text-sm text-center">No items yet. Add products from the catalogue.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {foodOrderItems.map((item) => {
                  const isMutating = !!loadingItems[item.id];
                  const qty = Number(item.quantity);
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-surface-border bg-surface p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white leading-tight flex-1 min-w-0 truncate">
                          {item.description}
                        </p>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isMutating}
                          className="shrink-0 text-surface-muted hover:text-danger transition-colors disabled:opacity-50"
                          title="Remove item"
                        >
                          {isMutating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateQty(item.id, qty - 1)}
                            disabled={isMutating}
                            className="h-6 w-6 rounded-md border border-surface-border bg-surface-card text-white hover:bg-surface-hover transition-colors flex items-center justify-center disabled:opacity-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-white">{qty}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, qty + 1)}
                            disabled={isMutating}
                            className="h-6 w-6 rounded-md border border-surface-border bg-surface-card text-white hover:bg-surface-hover transition-colors flex items-center justify-center disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-mono text-sm font-semibold text-white">
                          {formatCurrency(Number(item.totalPrice))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Order total */}
            {foodOrderItems.length > 0 && (
              <div className="p-4 border-t border-surface-border shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-surface-muted">Food Total</span>
                  <span className="font-mono font-bold text-brand text-base">
                    {formatCurrency(orderTotal)}
                  </span>
                </div>
                <p className="text-[10px] text-surface-muted mt-1">
                  Gaming charges will be added when the session ends.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="m-1 border-t border-surface-border bg-surface/50 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-surface-border text-white hover:bg-surface"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}