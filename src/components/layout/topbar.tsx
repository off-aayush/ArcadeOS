"use client";

import { useEffect, useState } from "react";
import { Bell, Clock, User as UserIcon } from "lucide-react";
import { formatTime } from "@/lib/utils";

export function Topbar() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-surface-border bg-surface/85 px-6 backdrop-blur-sm">
      {/* Search / Placeholder space */}
      <div className="flex items-center gap-4">
        {/* Can add search/breadcrumbs here in future */}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Clock */}
        <div className="flex items-center gap-2 text-sm text-surface-muted">
          <Clock className="h-4 w-4 text-brand" />
          <span className="font-mono">{time ? formatTime(time) : "—"}</span>
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-1.5 text-surface-muted hover:bg-surface-hover hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-surface-border pl-6">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-white">Admin User</span>
            <span className="text-xs text-surface-muted">Administrator</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 border border-brand/30 text-brand">
            <UserIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
