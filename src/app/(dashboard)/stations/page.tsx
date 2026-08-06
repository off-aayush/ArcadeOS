"use client";

import { useState } from "react";
import { StationGrid } from "@/features/stations/components/station-grid";
import { StationCreateDialog } from "@/features/stations/components/station-create-dialog";
import { StationEditDialog } from "@/features/stations/components/station-edit-dialog";
import { StationListItem } from "@/features/stations/types";

export default function StationsPage() {
  const [editingStation, setEditingStation] = useState<StationListItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-brand hover:bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow-brand transition-all active:scale-95"
          >
            + Create Station
          </button>
          <StationCreateDialog 
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>

      <StationGrid onEdit={(station) => setEditingStation(station)} />

      {editingStation && (
        <StationEditDialog
          station={editingStation}
          isOpen={!!editingStation}
          onClose={() => setEditingStation(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
