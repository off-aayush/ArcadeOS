"use client";

import { useEffect, useState } from "react";
import { StationListItem } from "../types";
import { StationStatusBadge } from "./station-status-badge";
import { STATION_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency, formatTimer } from "@/lib/utils";
import { Monitor, Laptop, Gamepad, Trophy, HelpCircle, Users, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StationCardProps {
  station: StationListItem;
  onEdit?: (station: StationListItem) => void;
}

const TYPE_ICONS = {
  PS5: Gamepad,
  PS4: Gamepad,
  PC: Laptop,
  RACING_SIMULATOR: Trophy,
  VR: Monitor,
  XBOX: Gamepad,
  SWITCH: Gamepad,
  OTHER: HelpCircle,
} as const;

export function StationCard({ station, onEdit }: StationCardProps) {
  const activeSession = station.sessions[0];
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    if (!activeSession) {
      setElapsedMs(0);
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(activeSession.startTime).getTime();
      const now = Date.now();
      const pausedTime = activeSession.totalPausedMs || 0;
      
      if (activeSession.pausedAt) {
        const pausedAtTime = new Date(activeSession.pausedAt).getTime();
        setElapsedMs(Math.max(0, pausedAtTime - start - pausedTime));
      } else {
        setElapsedMs(Math.max(0, now - start - pausedTime));
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const IconComponent = TYPE_ICONS[station.type as keyof typeof TYPE_ICONS] || HelpCircle;

  const cardGlow =
    station.status === "AVAILABLE"
      ? "shadow-glow-success border-success/30 hover:border-success/50"
      : station.status === "OCCUPIED"
      ? "shadow-glow-danger border-danger/30 hover:border-danger/50"
      : "border-surface-border hover:border-surface-muted";

  return (
    <div
      className={cn(
        "glass-card p-6 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 relative group",
        cardGlow
      )}
    >
      {/* Edit Trigger */}
      {onEdit && (
        <button
          onClick={() => onEdit(station)}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface border border-surface-border text-surface-muted opacity-0 group-hover:opacity-100 hover:text-white transition-opacity cursor-pointer"
          title="Edit Station"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Top Header */}
      <div className="flex items-start justify-between pr-6">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-white leading-tight">{station.name}</h3>
          <p className="text-xs text-surface-muted flex items-center gap-1.5">
            <IconComponent className="h-3.5 w-3.5" />
            {STATION_TYPE_LABELS[station.type as keyof typeof STATION_TYPE_LABELS] || station.type}
          </p>
        </div>
        <div className="shrink-0">
          <StationStatusBadge status={station.status} />
        </div>
      </div>

      {/* Dynamic Content Body based on state */}
      <div className="flex-1 py-4 flex flex-col justify-center text-center min-h-[90px]">
        {activeSession ? (
          <div className="space-y-2">
            <p className="text-3xl font-mono font-bold tracking-tight text-white animate-pulse">
              {formatTimer(elapsedMs)}
            </p>
            <p className="text-xs text-surface-muted flex items-center justify-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {activeSession.customer?.name || "Walk-in Customer"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-surface-muted">Rate per hour</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(Number(station.ratePerHour))}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between border-t border-surface-border pt-4 text-xs">
        <span className="text-surface-muted">
          Max players: {station.maxPlayers}
        </span>
        {station.status === "AVAILABLE" ? (
          <button className="rounded-lg bg-success/15 hover:bg-success/25 border border-success/30 px-3.5 py-1.5 font-semibold text-success transition-all active:scale-95">
            Start Session
          </button>
        ) : station.status === "OCCUPIED" ? (
          <button className="rounded-lg bg-danger/15 hover:bg-danger/25 border border-danger/30 px-3.5 py-1.5 font-semibold text-danger transition-all active:scale-95">
            Stop Session
          </button>
        ) : (
          <span className="text-surface-muted">Unavailable</span>
        )}
      </div>
    </div>
  );
}
