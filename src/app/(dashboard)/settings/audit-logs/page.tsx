"use client";

import { useState } from "react";
import { useAuditLogs } from "@/features/audit-logs/hooks/use-audit-logs";
import { AuditLogTable } from "@/features/audit-logs/components/audit-log-table";
import { Loader2, Activity } from "lucide-react";

export default function AuditLogsSettingsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>("ALL");
  
  const { data, isLoading, error } = useAuditLogs({
    page,
    pageSize: 50,
    action: action as any,
  });

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">System Audit Logs</h2>
          <p className="text-sm text-surface-muted mt-1">
            Immutable trail of all critical system actions, billing events, and user activity.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center text-danger">
          Failed to load audit logs. Please try again.
        </div>
      ) : (
        <AuditLogTable 
          logs={data?.data || []} 
          page={data?.metadata.page || 1}
          totalPages={data?.metadata.totalPages || 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
