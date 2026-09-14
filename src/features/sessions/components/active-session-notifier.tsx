"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES } from "@/lib/constants";
import { toast } from "@/components/ui/toast";

export function ActiveSessionNotifier() {
  const notifiedMap = useRef<Record<string, number>>({});

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("arcadeos_hourly_notifs");
      if (stored) {
        notifiedMap.current = JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useQuery({
    queryKey: ["active-sessions-polling"],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "ACTIVE" });
      const res = await fetch(`${API_ROUTES.sessions}?${params}`);
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      return data;
    },
    refetchInterval: 30000, // Check every 30 seconds
    enabled: true, // Always run this in the background
  });

  // We actually need to subscribe to the query data or just do the logic in onSuccess, but React Query v5 removed onSuccess.
  // We can use a separate hook or useEffect depending on the query data.
  return <NotifierLogic />;
}

function NotifierLogic() {
  const { data } = useQuery({
    queryKey: ["active-sessions-polling"],
  });

  const notifiedMap = useRef<Record<string, number>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("arcadeos_hourly_notifs");
      if (stored) {
        notifiedMap.current = JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const response = data as any;
    if (!response?.success || !response.data?.sessions) return;

    const sessions = response.data.sessions;
    let mapChanged = false;
    const now = Date.now();

    sessions.forEach((session: any) => {
      if (session.status !== "ACTIVE") return;

      const elapsedMs = Math.max(0, now - new Date(session.startTime).getTime() - (session.totalPausedMs ?? 0));
      const hours = Math.floor(elapsedMs / 3600000);

      if (hours >= 1) {
        const lastNotified = notifiedMap.current[session.id] || 0;
        if (hours > lastNotified) {
          // Trigger notification
          toast.add({
            title: "Time Alert",
            description: `Session on ${session.station.name} has been running for ${hours} hour${hours > 1 ? "s" : ""}!`,
            type: "warning",
          });
          notifiedMap.current[session.id] = hours;
          mapChanged = true;
        }
      }
    });

    if (mapChanged) {
      localStorage.setItem("arcadeos_hourly_notifs", JSON.stringify(notifiedMap.current));
    }
  }, [data]);

  return null;
}
