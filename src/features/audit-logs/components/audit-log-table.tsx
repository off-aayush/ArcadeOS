"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AuditLogWithUser } from "../types";
import { Activity, User, FileText, ChevronLeft, ChevronRight, Search, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  logs: AuditLogWithUser[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({ logs, page, totalPages, onPageChange }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border py-12 text-center">
        <Activity className="h-10 w-10 text-surface-muted mb-4" />
        <h3 className="text-lg font-semibold text-white">No audit logs found</h3>
        <p className="text-sm text-surface-muted max-w-sm mt-1">
          No system actions match the current filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border bg-surface/50">
              <tr>
                <th className="px-6 py-4 font-medium text-surface-muted">Timestamp</th>
                <th className="px-6 py-4 font-medium text-surface-muted">User</th>
                <th className="px-6 py-4 font-medium text-surface-muted">Action</th>
                <th className="px-6 py-4 font-medium text-surface-muted">Entity</th>
                <th className="px-6 py-4 font-medium text-surface-muted text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {logs.map((log) => (
                <tr key={log.id} className="group hover:bg-surface-hover/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-surface-muted">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </td>
                  
                  <td className="px-6 py-4">
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold">
                          {log.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{log.user.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-surface-muted">
                        <Activity className="h-4 w-4" />
                        <span>System</span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-surface border border-surface-border px-2 py-1 text-xs font-medium text-white">
                      {log.action}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-surface-muted">
                      <FileText className="h-4 w-4" />
                      <span>{log.entityType}</span>
                      <span className="text-[10px] bg-surface/50 px-1.5 py-0.5 rounded ml-1 font-mono">
                        {log.entityId.substring(0, 8)}…
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="rounded-lg p-1.5 text-surface-muted hover:text-white hover:bg-surface-hover transition-colors"
                      title="View Metadata"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-surface-border px-6 py-4 bg-surface/30">
          <p className="text-xs text-surface-muted">
            Page {page} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex items-center justify-center rounded-lg border border-surface-border bg-surface p-1.5 text-white hover:bg-surface-hover disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="flex items-center justify-center rounded-lg border border-surface-border bg-surface p-1.5 text-white hover:bg-surface-hover disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-surface-card border-surface-border text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-brand" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">Action</p>
                  <p className="text-sm font-semibold text-white">{selectedLog.action}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">Timestamp</p>
                  <p className="text-sm text-white">{format(new Date(selectedLog.createdAt), "PPpp")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">User</p>
                  <p className="text-sm text-white">{selectedLog.user ? selectedLog.user.name : "System"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">Entity</p>
                  <p className="text-sm text-white">{selectedLog.entityType} ({selectedLog.entityId})</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-surface-border">
                <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">Metadata Payload</p>
                {selectedLog.metadata ? (
                  <pre className="p-4 rounded-xl bg-surface border border-surface-border text-xs text-white overflow-x-auto font-mono">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-surface-muted italic">No metadata attached to this event.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
