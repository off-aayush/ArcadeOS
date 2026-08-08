"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatTimer } from "@/lib/utils";
import { PlayCircle, Clock } from "lucide-react";
import { ApiResponse } from "@/types";
import { SessionListItem } from "@/features/sessions/types";
import { API_ROUTES } from "@/lib/constants";

function TimerRow({ session }: { session: SessionListItem }) {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const isPaused = session.status === "PAUSED";

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(session.startTime).getTime();
      const now = Date.now();
      const pausedTime = session.totalPausedMs || 0;

      if (session.pausedAt) {
        const pausedAtTime = new Date(session.pausedAt).getTime();
        setElapsedMs(Math.max(0, pausedAtTime - start - pausedTime));
      } else {
        setElapsedMs(Math.max(0, now - start - pausedTime));
      }
    };

    calculateElapsed();
    if (!isPaused) {
      const interval = setInterval(calculateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [session, isPaused]);

  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{session.station.name}</p>
        <p className="text-xs text-surface-muted">{session.customer?.name || "Walk-in"}</p>
      </div>
      <div className="flex flex-col items-end">
        <p className={`font-mono font-bold tracking-tight ${isPaused ? "text-warning" : "text-white animate-pulse"}`}>
          {formatTimer(elapsedMs)}
        </p>
        {isPaused && <p className="text-[10px] text-warning uppercase">Paused</p>}
      </div>
    </div>
  );
}

export function RunningTimersOverview() {
  const { data } = useQuery<ApiResponse<{ sessions: SessionListItem[] }>>({
    queryKey: ["active-sessions-overview"],
    queryFn: async () => {
      // Fetch both ACTIVE and PAUSED sessions
      const res = await fetch(`${API_ROUTES.sessions}?status=ALL`); // The API doesn't support multiple statuses easily, so fetch ALL and filter or fetch ACTIVE and PAUSED separately. Wait, we'll fetch ALL and filter in client since it's a small dataset usually.
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const allSessions = data?.success ? data.data.sessions : [];
  const runningSessions = allSessions.filter(s => s.status === "ACTIVE" || s.status === "PAUSED");

  return (
    <div className="glass-card flex flex-col border border-surface-border bg-surface-card/60 h-full">
      <div className="p-4 border-b border-surface-border flex items-center gap-2">
        <Clock className="h-5 w-5 text-accent" />
        <h3 className="font-bold text-white tracking-tight">Running Sessions</h3>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
          {runningSessions.length}
        </span>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto max-h-[300px] sm:max-h-none">
        {runningSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center opacity-50">
            <PlayCircle className="h-8 w-8 text-surface-muted mb-2" />
            <p className="text-sm text-surface-muted">No active sessions</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {runningSessions.map(session => (
              <TimerRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
