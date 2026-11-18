import { PageHeader } from "@/components/shared/page-header";
import { SpendingsDashboard } from "@/features/spendings/components/spendings-dashboard";

export const metadata = { title: "Spendings" };

export default function SpendingsPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        title="Spendings"
        description="Track lounge purchases and expenses separately from customer revenue."
      />
      <SpendingsDashboard />
    </div>
  );
}
