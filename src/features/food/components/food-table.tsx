"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FoodListItem } from "../types";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Coffee, Edit2, Search, ArrowUpDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FoodCategory } from "@prisma/client";
import { FoodFormDialog } from "./food-form-dialog";
import { StockAdjustDialog } from "./stock-adjust-dialog";

export function FoodTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [inStock, setInStock] = useState<string>("ALL");

  const [selectedItem, setSelectedItem] = useState<FoodListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const params = new URLSearchParams({ category, inStock });
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["food", category, inStock, debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/food?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load inventory");
      return res.json();
    },
  });

  const items: FoodListItem[] = data?.success ? data.data.items : [];
  const total = data?.success ? data.data.total : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          {Object.keys(FoodCategory).map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>

        <select
          value={inStock}
          onChange={(e) => setInStock(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
        >
          <option value="ALL">All Stock Levels</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>

        <button
          onClick={() => { setSelectedItem(null); setIsFormOpen(true); }}
          className="ml-auto rounded-lg bg-brand hover:bg-brand-hover px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          + Add Product
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {isError ? (
          <ErrorState title="Failed to Load Inventory" description="Could not connect to the database." error={error as Error} onRetry={refetch} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="px-4 py-3 font-semibold text-surface-muted">Product</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Category</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Price</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Stock</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-surface-muted">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16">
                      <EmptyState title="No Products Found" description="Add a product or adjust your filters." icon={<Coffee className="h-8 w-8 text-surface-muted" />} />
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isLowStock = item.stock > 0 && item.stock <= item.minStock;
                    const isOutOfStock = item.stock === 0;

                    return (
                      <tr key={item.id} className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={cn("font-medium", !item.isAvailable ? "text-surface-muted line-through" : "text-white")}>
                              {item.name}
                            </span>
                            {!item.isAvailable && <span className="text-[10px] text-danger uppercase font-bold">Unavailable</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-surface border border-surface-border px-2 py-0.5 text-xs text-surface-muted">
                            {item.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {formatCurrency(Number(item.price))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold text-lg",
                              isOutOfStock ? "text-danger" : isLowStock ? "text-warning" : "text-white"
                            )}>
                              {item.stock}
                            </span>
                            {isLowStock && <AlertCircle className="h-4 w-4 text-warning" title="Low Stock" />}
                            {isOutOfStock && <span className="text-[10px] text-danger font-bold uppercase border border-danger/30 bg-danger/10 px-1.5 rounded-sm">Empty</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedItem(item); setIsAdjustOpen(true); }}
                              className="flex items-center gap-1 rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/20 transition-colors"
                            >
                              <ArrowUpDown className="h-3 w-3" />
                              Adjust
                            </button>
                            <button
                              onClick={() => { setSelectedItem(item); setIsFormOpen(true); }}
                              className="rounded-md p-1.5 text-surface-muted hover:bg-surface hover:text-white transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FoodFormDialog item={selectedItem as any} isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <StockAdjustDialog item={selectedItem} isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} />
    </div>
  );
}
