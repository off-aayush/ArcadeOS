import { PageHeader } from "@/components/shared/page-header";
import { ReportsDashboard } from "@/features/reports/components/reports-dashboard";

export const metadata = {
  title: "Reports & Analytics",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Monitor lounge performance, revenue trends, and station usage."
      />

      <ReportsDashboard />
    </div>
  );
}
