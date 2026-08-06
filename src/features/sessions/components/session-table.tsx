"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SessionListItem } from "../types";
import { API_ROUTES, STATION_TYPE_LABELS } from "@/lib/constants";
import { ApiResponse } from "@/types";
import { formatCurrency, formatDuration, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PlayCircle, Gamepad2, Users, Search, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ListResult = { sessions: SessionListItem[]; total: number };

function SessionRowSkeleton() {
  return (
    <tr className="border-b border-surface-border animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-surface-border w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function SessionTable() {
  const [status, setStatus] = useState<string>("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const params = new URLSearchParams({ status });
  
  const { data, isLoading, isError, error, refetch } = useQuery<ApiResponse<ListResult>>({
    queryKey: ["sessions", status],
    queryFn: async () => {
      const res = await fetch(`${API_ROUTES.sessions}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
    refetchInterval: status === "ACTIVE" ? 10000 : false, // auto-refresh active sessions every 10s
  });

  const sessions = data?.success ? data.data.sessions : [];
  const total = data?.success ? data.data.total : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters & Refresh */}
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-surface-muted hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        {total > 0 && (
          <span className="text-sm text-surface-muted ml-auto">
            {total} session{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isError ? (
          <ErrorState
            title="Failed to Load Sessions"
            description="Could not connect to the database."
            error={error as Error}
            onRetry={refetch}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="px-4 py-3 font-semibold text-surface-muted">Station</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Customer</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Time</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Duration</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted">Status</th>
                  <th className="px-4 py-3 font-semibold text-surface-muted text-right">Bill</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <SessionRowSkeleton key={i} />)
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <EmptyState
                        title="No Sessions Found"
                        description="No gaming sessions match your filters."
                        icon={<PlayCircle className="h-8 w-8 text-surface-muted" />}
                      />
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    // Calculate duration
                    let durationMs = 0;
                    if (session.endTime) {
                      durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime() - session.totalPausedMs;
                    } else {
                      const end = session.pausedAt ? new Date(session.pausedAt).getTime() : Date.now();
                      durationMs = end - new Date(session.startTime).getTime() - session.totalPausedMs;
                    }

                    return (
                      <tr
                        key={session.id}
                        className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors"
                      >
                        {/* Station */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-white flex items-center gap-1.5">
                              <Gamepad2 className="h-3.5 w-3.5 text-brand" />
                              {session.station.name}
                            </span>
                            <span className="text-xs text-surface-muted">
                              {STATION_TYPE_LABELS[session.station.type as keyof typeof STATION_TYPE_LABELS] || session.station.type}
                            </span>
                          </div>
                        </td>
                        {/* Customer */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-surface-muted" />
                            <span className={cn(session.customer ? "text-white" : "text-surface-muted italic")}>
                              {session.customer?.name || "Walk-in"}
                            </span>
                          </div>
                        </td>
                        {/* Time */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-xs">
                            <span className="text-surface-muted">
                              Start: <span className="text-white">{formatDateTime(session.startTime)}</span>
                            </span>
                            {session.endTime && (
                              <span className="text-surface-muted">
                                End: <span className="text-white">{formatDateTime(session.endTime)}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Duration */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-white font-mono">
                            <Clock className="h-3.5 w-3.5 text-surface-muted" />
                            {formatDuration(Math.max(0, durationMs))}
                          </div>
                          {session.totalPausedMs > 0 && (
                            <span className="text-xs text-warning/80">
                              (Paused {formatDuration(session.totalPausedMs)})
                            </span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            session.status === "ACTIVE" && "bg-success/20 text-success border border-success/30",
                            session.status === "PAUSED" && "bg-warning/20 text-warning border border-warning/30",
                            session.status === "COMPLETED" && "bg-surface border border-surface-border text-surface-muted",
                            session.status === "CANCELLED" && "bg-danger/20 text-danger border border-danger/30"
                          )}>
                            {session.status}
                          </span>
                        </td>
                        {/* Bill */}
                        <td className="px-4 py-3 text-right">
                          {session.bill ? (
                            <span className="font-medium text-white">
                              {formatCurrency(Number(session.bill.grandTotal))}
                            </span>
                          ) : session.status === "COMPLETED" ? (
                            <span className="text-xs text-warning">Pending Bill</span>
                          ) : (
                            <span className="text-xs text-surface-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
