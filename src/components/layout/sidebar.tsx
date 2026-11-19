"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  LayoutDashboard,
  Monitor,
  Users,
  PlayCircle,
  Receipt,
  BarChart3,
  Settings,
  Gamepad2,
  Coffee,
  Wallet,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Stations", href: "/stations", icon: Monitor },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Sessions", href: "/sessions", icon: PlayCircle },
  { label: "Inventory", href: "/inventory", icon: Coffee },
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "Spendings", href: "/spendings", icon: Wallet, superAdminOnly: true },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const permissions = user?.role.permissions ?? [];
  const visibleItems = navItems.filter((item) => {
    if (item.href === "/inventory") return permissions.includes("MANAGE_INVENTORY");
    if (item.href === "/reports") return permissions.includes("VIEW_REPORTS");
    if (item.href === "/settings") return ["MANAGE_USERS", "MANAGE_DISCOUNTS", "VIEW_AUDIT_LOGS", "MANAGE_PARLOUR_PROFILE"]
      .some((permission) => permissions.includes(permission as any));
    return true;
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-surface-border bg-surface-card/80 backdrop-blur-sm">
      {/* Brand Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-surface-border px-6">
        <Gamepad2 className="h-6 w-6 text-brand" />
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight gradient-text">The Lobby</span>
          <span className="text-[9px] text-surface-muted font-medium tracking-wide">Powered by ArcadeOS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", isActive && "active")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-surface-border p-4 text-center">
        <p className="text-xs text-surface-muted">The Lobby · Powered by ArcadeOS</p>
      </div>
    </aside>
  );
}
