"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CustomerListItem } from "../types";
import { API_ROUTES, CUSTOMER_STALE_TIME, MEMBERSHIP_TIER_STYLES } from "@/lib/constants";
import { ApiResponse } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Users, Search, Phone, Mail, Crown, Trash2, Edit2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerTableProps {
  onEdit?: (customer: CustomerListItem) => void;
}

type ListResult = { customers: CustomerListItem[]; total: number };

function CustomerRowSkeleton() {
  return (
    <tr className="border-b border-surface-border animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-surface-border w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function CustomerTable({ onEdit }: CustomerTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Simple debounce
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearchChange as any)._timer);
    (handleSearchChange as any)._timer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const params = new URLSearchParams({ status: "active" });
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, isLoading, isError, error, refetch } = useQuery<ApiResponse<ListResult>>({
    queryKey: ["customers", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`${API_ROUTES.customers}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load customers");
      return res.json();
    },
    staleTime: CUSTOMER_STALE_TIME,
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_ROUTES.customers}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to delete customer");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } finally {
      setDeletingId(null);
    }
  };

  const customers = data?.success ? data.data.customers : [];
  const total = data?.success ? data.data.total : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Refresh Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-surface-muted hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        {total > 0 && (
          <span className="text-sm text-surface-muted ml-auto">
            {total} customer{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isError ? (
          <ErrorState
            title="Failed to Load Customers"
            description="Could not connect to the database."
            error={error as Error}
            onRetry={refetch}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="px-4 py-3 font-semibold text-surface-muted">Name</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Contact</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Membership</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted text-right">Visits</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted text-right">Total Spend</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <CustomerRowSkeleton key={i} />)
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <EmptyState
                        title="No Customers Found"
                        description={debouncedSearch ? `No results for "${debouncedSearch}".` : "No customers registered yet. Add your first customer!"}
                        icon={<Users className="h-8 w-8 text-surface-muted" />}
                      />
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const tier = customer.membership?.tier;
                    const tierStyle = tier ? MEMBERSHIP_TIER_STYLES[tier] : null;
                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors group"
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{customer.name}</span>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            {customer.phone && (
                              <span className="flex items-center gap-1 text-surface-muted text-xs">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </span>
                            )}
                            {customer.email && (
                              <span className="flex items-center gap-1 text-surface-muted text-xs">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </span>
                            )}
                            {!customer.phone && !customer.email && (
                              <span className="text-surface-muted text-xs italic">No contact info</span>
                            )}
                          </div>
                        </td>
                        {/* Membership */}
                        <td className="px-4 py-3">
                          {tier && tierStyle ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                tierStyle.bg,
                                tierStyle.color
                              )}
                            >
                              <Crown className="h-3 w-3" />
                              {tier}
                            </span>
                          ) : (
                            <span className="text-surface-muted text-xs">Walk-in</span>
                          )}
                        </td>
                        {/* Visits */}
                        <td className="px-4 py-3 text-right font-mono text-white">
                          {customer.totalVisits}
                        </td>
                        {/* Total Spend */}
                        <td className="px-4 py-3 text-right font-mono font-semibold text-success">
                          {formatCurrency(Number(customer.totalSpend))}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(customer)}
                                className="rounded-lg p-1.5 text-surface-muted hover:bg-surface-hover hover:text-white transition-colors"
                                title="Edit Customer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(customer.id, customer.name)}
                              disabled={deletingId === customer.id}
                              className="rounded-lg p-1.5 text-surface-muted hover:bg-danger/20 hover:text-danger transition-colors disabled:opacity-50"
                              title="Delete Customer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
