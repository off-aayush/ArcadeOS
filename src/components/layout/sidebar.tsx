"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Stations", href: "/stations", icon: Monitor },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Sessions", href: "/sessions", icon: PlayCircle },
  { label: "Inventory", href: "/inventory", icon: Coffee },
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-surface-border bg-surface-card/80 backdrop-blur-sm">
      {/* Brand Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-surface-border px-6">
        <Gamepad2 className="h-6 w-6 text-brand" />
        <span className="text-lg font-bold tracking-tight">
          <span className="gradient-text">ArcadeOS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
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
        <p className="text-xs text-surface-muted">ArcadeOS v1.0.0</p>
      </div>
    </aside>
  );
}
