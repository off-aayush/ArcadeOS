import { SessionTable } from "@/features/sessions/components/session-table";

export default function SessionsPage() {
  return (
    <div className="flex flex-col space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sessions History</h1>
          <p className="text-muted-foreground mt-1">
            View active, paused, and completed gaming sessions.
          </p>
        </div>
      </div>

      {/* Sessions Data Table */}
      <SessionTable />
    </div>
  );
}
