"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { loginSchema, LoginFormValues } from "../validators";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!data.success) {
        setServerError(data.error || "Login failed. Please try again.");
        return;
      }

      // Invalidate auth query so useAuth() re-fetches
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });

      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Server Error */}
      {serverError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-surface-muted"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@arcadeos.local"
          {...register("email")}
          className={cn(
            "w-full rounded-xl border bg-surface-card/50 px-4 py-3 text-sm text-white placeholder:text-surface-muted/50 outline-none transition-all focus:ring-2 focus:ring-brand/50",
            errors.email
              ? "border-danger/50 focus:ring-danger/30"
              : "border-surface-border focus:border-brand/40"
          )}
        />
        {errors.email && (
          <p className="text-xs text-danger">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-surface-muted"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className={cn(
              "w-full rounded-xl border bg-surface-card/50 px-4 py-3 pr-12 text-sm text-white placeholder:text-surface-muted/50 outline-none transition-all focus:ring-2 focus:ring-brand/50",
              errors.password
                ? "border-danger/50 focus:ring-danger/30"
                : "border-surface-border focus:border-brand/40"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-surface-muted transition-colors hover:text-white"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-danger">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-glow-brand transition-all",
          "hover:bg-brand-600 active:scale-95",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign In
          </>
        )}
      </button>
    </form>
  );
}
