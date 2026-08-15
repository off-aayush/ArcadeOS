"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Clock, LogOut, ChevronDown } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useAuthContext } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  RECEPTIONIST: "Receptionist",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [time, setTime] = useState<Date | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-surface-border bg-surface/85 px-6 backdrop-blur-sm">
      {/* Left — breadcrumbs placeholder */}
      <div className="flex items-center gap-4" />

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

        {/* User Profile + Dropdown */}
        <div className="relative border-l border-surface-border pl-6">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface-hover"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 border border-brand/30 text-brand text-sm font-bold select-none">
              {user ? getInitials(user.name) : "?"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-white leading-tight">
                {user?.name ?? "Loading…"}
              </span>
              <span className="text-xs text-surface-muted leading-tight">
                {user ? ROLE_LABELS[user.role] ?? user.role : ""}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-surface-muted" />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <>
              {/* Backdrop to close */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-surface-border bg-surface-card/95 py-1 shadow-card backdrop-blur-sm">
                <div className="border-b border-surface-border px-4 py-2.5">
                  <p className="text-xs text-surface-muted">Signed in as</p>
                  <p className="truncate text-sm font-medium text-white">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
