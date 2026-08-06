"use client";

import { useQuery } from "@tanstack/react-query";
import { StationCard } from "./station-card";
import { StationCardSkeleton } from "./station-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { API_ROUTES, STATION_STALE_TIME } from "@/lib/constants";
import { ApiResponse } from "@/types";
import { StationListItem } from "../types";

export function StationGrid() {
  const { data, isLoading, isError, error, refetch } = useQuery<ApiResponse<StationListItem[]>>({
    queryKey: ["stations"],
    queryFn: async () => {
      const res = await fetch(API_ROUTES.stations);
      if (!res.ok) {
        throw new Error("Failed to load stations data from server");
      }
      return res.json();
    },
    refetchInterval: STATION_STALE_TIME, // Poll every 10 seconds (Dashboard Stale time)
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

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

  if (stations.length === 0) {
    return (
      <EmptyState
        title="No Stations Found"
        description="There are no gaming stations registered in the database. Please add them in the Stations panel."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stations.map((station) => (
        <StationCard key={station.id} station={station} />
      ))}
    </div>
  );
}
