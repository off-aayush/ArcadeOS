"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { API_ROUTES } from "@/lib/constants";
import { CustomerListItem } from "@/features/customers/types";
import { ApiResponse } from "@/types";
import { cn } from "@/lib/utils";
import { CustomerCreateDialog } from "@/features/customers/components/customer-create-dialog";
import { Search, UserPlus, Loader2 } from "lucide-react";

interface AttachCustomerDialogProps {
  bill: BillWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBill: BillWithDetails) => void;
}

type CustomerResult = { customers: CustomerListItem[]; total: number };

export function AttachCustomerDialog({
  bill,
  isOpen,
  onClose,
  onSuccess,
}: AttachCustomerDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  const [isCustomerCreateOpen, setIsCustomerCreateOpen] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    enabled: isOpen,
  });

  const customers = customerData?.success ? customerData.data.customers : [];

  const handleClose = () => {
    setCustomerSearch("");
    setDebouncedSearch("");
    setSelectedCustomer(null);
    onClose();
  };

  const handleCustomerCreated = async (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setDebouncedSearch("");
    // Automatically attach upon creation
    await submitAttach(customer.id);
  };

  const submitAttach = async (customerId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/attach-customer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to attach customer");

      toast.add({ title: "Customer Attached", description: "The customer has been attached to the bill and session.", type: "success" });
      onSuccess(data.data);
      handleClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttach = () => {
    if (!selectedCustomer) return;
    submitAttach(selectedCustomer.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[440px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Attach Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-surface-muted">Search Existing Customer</Label>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-white">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-surface-muted">{selectedCustomer.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setDebouncedSearch(""); }}
                  className="text-xs text-surface-muted hover:text-danger transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
                    value={customerSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                {customerSearch && (
                  <div className="rounded-lg border border-surface-border bg-surface-card max-h-40 overflow-y-auto divide-y divide-surface-border/50 mt-1">
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
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setDebouncedSearch(""); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-surface-hover"
                          >
                            <div>
                              <span className="text-sm font-medium text-white block">{c.name}</span>
                              <span className="text-xs text-surface-muted">{c.phone || c.email || ""}</span>
                            </div>
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
            )}
          </div>

          {!selectedCustomer && !customerSearch && (
             <div className="pt-2 text-center text-sm text-surface-muted">
                or
                <div className="mt-3">
                   <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCustomerCreateOpen(true)}
                      className="border-surface-border text-white hover:bg-surface w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Enroll New Customer
                    </Button>
                </div>
             </div>
          )}

        </div>

        <DialogFooter className="pt-4 border-t border-surface-border gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="bg-transparent border-surface-border hover:bg-surface text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAttach}
            disabled={!selectedCustomer || isSubmitting}
            className="bg-brand hover:bg-brand/80 text-white font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Attaching...
              </>
            ) : (
              "Attach Customer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <CustomerCreateDialog
        isOpen={isCustomerCreateOpen}
        onClose={() => setIsCustomerCreateOpen(false)}
        onSuccess={handleCustomerCreated}
      />
    </Dialog>
  );
}
