import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArcadeOS — Gaming Lounge Management",
};

// Temporary landing page — will be replaced by the dashboard in Feature 2
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      {/* Hero */}
      <div className="text-center space-y-4 animate-slide-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm text-brand">
          <span className="status-dot bg-brand" />
          System Online
        </div>

        <h1 className="text-5xl font-bold tracking-tight">
          <span className="gradient-text">ArcadeOS</span>
        </h1>
        <p className="text-lg text-surface-muted max-w-md">
          Realtime Gaming Lounge Management Platform
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl animate-fade-in">
        {[
          { label: "Database", status: "Connecting...", color: "text-warning" },
          { label: "Stations", status: "0 Active", color: "text-success" },
          { label: "Sessions", status: "0 Running", color: "text-accent" },
        ].map((item) => (
          <div key={item.label} className="glass-card p-5 text-center space-y-1">
            <p className="text-xs text-surface-muted uppercase tracking-widest">
              {item.label}
            </p>
            <p className={`text-sm font-semibold ${item.color}`}>
              {item.status}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-glow-brand transition-all hover:bg-brand-600 hover:shadow-glow-brand active:scale-95"
      >
        Open Dashboard →
      </Link>

      <p className="text-xs text-surface-muted">
        Feature 1 complete — Foundation &amp; Database Schema ✓
      </p>
    </main>
  );
}
