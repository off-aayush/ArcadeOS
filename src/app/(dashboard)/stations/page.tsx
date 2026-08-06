"use client";

import { useState } from "react";
import { StationGrid } from "@/features/stations/components/station-grid";
import { StationCreateDialog } from "@/features/stations/components/station-create-dialog";
import { StationEditDialog } from "@/features/stations/components/station-edit-dialog";
import { StationListItem } from "@/features/stations/types";

export default function StationsPage() {
  const [editingStation, setEditingStation] = useState<StationListItem | null>(null);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Stations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your gaming stations, set pricing, and toggle maintenance mode.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <StationCreateDialog />
        </div>
      </div>

      <StationGrid onEdit={(station) => setEditingStation(station)} />

      {editingStation && (
        <StationEditDialog
          stationId={editingStation.id}
          open={!!editingStation}
          onOpenChange={(open) => {
            if (!open) setEditingStation(null);
          }}
        />
      )}
    </div>
  );
}
