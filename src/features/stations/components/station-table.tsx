"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { API_ROUTES, STATION_TYPE_LABELS } from "@/lib/constants";
import { ApiResponse } from "@/types";
import { StationListItem } from "../types";
import { formatCurrency } from "@/lib/utils";
import { StationStatusBadge } from "./station-status-badge";
import { Edit2, Monitor } from "lucide-react";

export interface StationTableProps {
  onEdit?: (station: StationListItem) => void;
}

function StationRowSkeleton() {
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

export function StationTable({ onEdit }: StationTableProps = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery<ApiResponse<StationListItem[]>>({
    queryKey: ["stations"],
    queryFn: async () => {
      const res = await fetch(API_ROUTES.stations);
      if (!res.ok) {
        throw new Error("Failed to load stations data from server");
      }
      return res.json();
    },
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Stations"
        description="We couldn't connect to the database to fetch the gaming stations."
        error={error as Error}
        onRetry={refetch}
      />
    );
  }

  const stations = data?.success ? data.data : [];

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left">
              <th className="px-4 py-3 font-semibold text-surface-muted">Name</th>
              <th className="px-4 py-3 font-semibold text-surface-muted">Type</th>
              <th className="px-4 py-3 font-semibold text-surface-muted">Status</th>
              <th className="px-4 py-3 font-semibold text-surface-muted text-right">Rate / Hour</th>
              <th className="px-4 py-3 font-semibold text-surface-muted text-center">Max Players</th>
              <th className="px-4 py-3 font-semibold text-surface-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <StationRowSkeleton key={i} />)
            ) : stations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16">
                  <EmptyState
                    title="No Stations Found"
                    description="There are no gaming stations registered in the database. Please add them."
                    icon={<Monitor className="h-8 w-8 text-surface-muted" />}
                  />
                </td>
              </tr>
            ) : (
              stations.map((station) => (
                <tr
                  key={station.id}
                  className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{station.name}</td>
                  <td className="px-4 py-3 text-surface-muted">
                    {STATION_TYPE_LABELS[station.type as keyof typeof STATION_TYPE_LABELS] || station.type}
                  </td>
                  <td className="px-4 py-3">
                    <StationStatusBadge status={station.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {formatCurrency(Number(station.ratePerHour))}
                  </td>
                  <td className="px-4 py-3 text-center text-surface-muted font-mono">
                    {station.maxPlayers}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(station)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-surface-border bg-surface text-surface-muted hover:text-white hover:border-brand/50 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
