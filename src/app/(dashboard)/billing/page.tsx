import { BillTable } from "@/features/billing/components/bill-table";
import { Receipt } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex flex-col space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Receipt className="h-8 w-8 text-brand" />
            Billing
          </h1>
          <p className="text-surface-muted mt-1">
            View and manage all invoices. Generate bills from the Sessions page.
          </p>
        </div>
      </div>

      {/* Bills Data Table */}
      <BillTable />
    </div>
  );
}
