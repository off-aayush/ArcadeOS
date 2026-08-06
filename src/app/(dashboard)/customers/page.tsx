"use client";

import { useState } from "react";
import { CustomerTable } from "@/features/customers/components/customer-table";
import { CustomerCreateDialog } from "@/features/customers/components/customer-create-dialog";
import { CustomerEditDialog } from "@/features/customers/components/customer-edit-dialog";
import { CustomerListItem } from "@/features/customers/types";

export default function CustomersPage() {
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage walk-in and registered customers, view history and membership tiers.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-brand hover:bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow-brand transition-all active:scale-95"
        >
          + Register Customer
        </button>
      </div>

      {/* Customer Data Table */}
      <CustomerTable onEdit={(customer) => setEditingCustomer(customer)} />

      {/* Dialogs */}
      <CustomerCreateDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <CustomerEditDialog
        customer={editingCustomer}
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
      />
    </div>
  );
}
