"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StationListItem } from "../types";
import { StationStatusBadge } from "./station-status-badge";
import { STATION_TYPE_LABELS, API_ROUTES } from "@/lib/constants";
import { formatCurrency, formatTimer } from "@/lib/utils";
import { Monitor, Laptop, Gamepad, Trophy, HelpCircle, Users, Edit2, Pause, Play, Square, Glasses, GlassesIcon, LucideGlasses, HeadsetIcon, LucideRulerDimensionLine, BoxIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StartSessionDialog } from "@/features/sessions/components/start-session-dialog";
import { toast } from "@/components/ui/toast";
import { BillDetailDialog } from "@/features/billing/components/bill-detail-dialog";

interface StationCardProps {
  station: StationListItem;
  onEdit?: (station: StationListItem) => void;
}

const TYPE_ICONS = {
  PS5: Gamepad,
  PS4: Gamepad,
  PC: Monitor,
  RACING_SIMULATOR: Trophy,
  VR: BoxIcon,
  XBOX: Gamepad,
  SWITCH: Gamepad,
  OTHER: HelpCircle,
} as const;

export function StationCard({ station, onEdit }: StationCardProps) {
  const queryClient = useQueryClient();
  const activeSession = station.sessions[0];
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [billingSessionId, setBillingSessionId] = useState<string | null>(null);

  const startTime = activeSession?.startTime;
  const totalPausedMs = activeSession?.totalPausedMs || 0;
  const pausedAt = activeSession?.pausedAt;

  useEffect(() => {
    if (!startTime) {
      setElapsedMs(0);
      return;
    }

    const start = new Date(startTime).getTime();
    const pausedAtTime = pausedAt ? new Date(pausedAt).getTime() : null;

    const calculateElapsed = () => {
      const now = Date.now();

      if (pausedAtTime) {
        setElapsedMs(Math.max(0, pausedAtTime - start - totalPausedMs));
      } else {
        setElapsedMs(Math.max(0, now - start - totalPausedMs));
      }
    };

    calculateElapsed();
    // Only run the interval if the session is not paused
    if (!pausedAtTime) {
      const interval = setInterval(calculateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, totalPausedMs, pausedAt]);

  const IconComponent = TYPE_ICONS[station.type as keyof typeof TYPE_ICONS] || HelpCircle;

  const cardGlow =
    station.status === "AVAILABLE"
      ? "shadow-glow-success border-success/30 hover:border-success/50"
      : station.status === "OCCUPIED"
        ? "shadow-glow-danger border-danger/30 hover:border-danger/50"
        : "border-surface-border hover:border-surface-muted";

  // Action: Pause / Resume / Stop
  const handleSessionAction = async (action: "pause" | "resume" | "stop") => {
    if (!activeSession) return;
    setIsActing(true);
    try {
      const res = await fetch(`${API_ROUTES.sessions}/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} session`);

      const labels = { pause: "Paused", resume: "Resumed", stop: "Stopped" };
      toast.add({ title: `Session ${labels[action]}`, description: `${station.name} session ${action}d.`, type: "success" });
      queryClient.invalidateQueries({ queryKey: ["stations"] });

      if (action === "stop") {
        setBillingSessionId(activeSession.id);
      }
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsActing(false);
    }
  };

  const isPaused = activeSession?.pausedAt !== null && activeSession?.status === "PAUSED";

  return (
    <>
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
              <p className={cn(
                "text-3xl font-mono font-bold tracking-tight text-white",
                !isPaused && "animate-pulse"
              )}>
                {formatTimer(elapsedMs)}
              </p>
              <p className="text-xs text-surface-muted flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {activeSession.customer?.name || "Walk-in Customer"}
              </p>
              {isPaused && (
                <span className="inline-block text-[10px] font-semibold text-warning bg-warning/15 border border-warning/30 rounded-full px-2 py-0.5">
                  PAUSED
                </span>
              )}
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
            <button
              onClick={() => setIsStartOpen(true)}
              disabled={isActing}
              className="rounded-lg bg-success/15 hover:bg-success/25 border border-success/30 px-3.5 py-1.5 font-semibold text-success transition-all active:scale-95 disabled:opacity-50"
            >
              ▶ Start Session
            </button>
          ) : station.status === "OCCUPIED" && activeSession ? (
            <div className="flex items-center gap-1.5">
              {/* Pause / Resume toggle */}
              <button
                onClick={() => handleSessionAction(isPaused ? "resume" : "pause")}
                disabled={isActing}
                title={isPaused ? "Resume" : "Pause"}
                className="rounded-lg p-1.5 border border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 transition-all disabled:opacity-50"
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
              {/* Stop session */}
              <button
                onClick={() => handleSessionAction("stop")}
                disabled={isActing}
                title="Stop Session"
                className="rounded-lg bg-danger/15 hover:bg-danger/25 border border-danger/30 px-3.5 py-1.5 font-semibold text-danger transition-all active:scale-95 disabled:opacity-50"
              >
                <Square className="h-3 w-3 inline mr-1" />
                Stop
              </button>
            </div>
          ) : (
            <span className="text-surface-muted">Unavailable</span>
          )}
        </div>
      </div>

      {/* Start Session Dialog */}
      <StartSessionDialog
        station={station}
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
      />

      {/* Bill Generation Dialog */}
      <BillDetailDialog
        sessionId={billingSessionId ?? undefined}
        isOpen={!!billingSessionId}
        onClose={() => setBillingSessionId(null)}
      />
    </>
  );
}
