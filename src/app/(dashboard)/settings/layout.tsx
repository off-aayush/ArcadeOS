"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Tag, ClipboardList, Building2 } from "lucide-react";

const settingsTabs = [
  { label: "Users & Roles", href: "/settings/users", icon: Users },
  { label: "Discounts", href: "/settings/discounts", icon: Tag },
  { label: "Audit Logs", href: "/settings/audit-logs", icon: ClipboardList },
  { label: "Parlour Profile", href: "/settings/profile", icon: Building2 },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-surface-muted mt-1">
          Manage users, discounts, and parlour configuration.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-surface-border pb-0">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                isActive
                  ? "border-brand text-brand bg-brand/5"
                  : "border-transparent text-surface-muted hover:text-white hover:bg-surface-hover"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
