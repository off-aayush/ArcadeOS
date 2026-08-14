import { PageHeader } from "@/components/shared/page-header";
import { ReportsDashboard } from "@/features/reports/components/reports-dashboard";

export const metadata = {
  title: "Reports & Analytics",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      <PageHeader
        title="Reports & Analytics"
        description="Monitor lounge performance, revenue trends, and station usage."
      />

      <ReportsDashboard />
    </div>
  );
}
