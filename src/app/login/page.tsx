import type { Metadata } from "next";
import { Suspense } from "react";
import { Gamepad2, Shield } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface p-6">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10 shadow-glow-brand">
            <Gamepad2 className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">ArcadeOS</span>
            </h1>
            <p className="mt-1 text-sm text-surface-muted">
              Gaming Lounge Management Platform
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl border border-surface-border bg-surface-card/80 p-8 backdrop-blur-xl">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-surface-muted mb-3">
              <Shield className="h-3.5 w-3.5" />
              <span>Staff access only</span>
            </div>
            <h2 className="text-xl font-bold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-surface-muted">
              Sign in to your staff account to continue.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-surface-muted">
          ArcadeOS v1.0.0 · Internal Staff Portal
        </p>
      </div>
    </main>
  );
}
