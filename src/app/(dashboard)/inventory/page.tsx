import { PageHeader } from "@/components/shared/page-header";
import { FoodTable } from "@/features/food/components/food-table";

export const metadata = {
  title: "Inventory Management",
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage lounge snacks, beverages, and other sellable products."
      />
      <FoodTable />
    </div>
  );
}
