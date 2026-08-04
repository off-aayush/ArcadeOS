// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — Utility Helpers
// Pure functions. No side effects. All typed.
// ─────────────────────────────────────────────────────────────────────────────

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY_SYMBOL, BILL_NUMBER_PREFIX, ROUNDING_PRECISION } from "@/lib/constants";

// ── Tailwind Class Helper ─────────────────────────────────────────────────────
/// Merges Tailwind classes intelligently — resolves conflicts (e.g. p-2 vs p-4)
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Currency Formatting ───────────────────────────────────────────────────────
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return `${CURRENCY_SYMBOL}${num.toFixed(2)}`;
}

export function roundBill(amount: number): number {
  const factor = Math.pow(10, ROUNDING_PRECISION);
  return Math.round(amount * factor) / factor;
}

export function getRoundingDiff(exact: number): number {
  return roundBill(exact) - exact;
}

// ── Duration Helpers ──────────────────────────────────────────────────────────
/// Format milliseconds into a human-readable "Xh Ym Zs" string
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

/// Format milliseconds into "HH:MM:SS" — used for the live timer display
export function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

/// Calculate billable time in hours from milliseconds (excludes paused time)
export function msToBillableHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

/// Calculate session amount based on duration and hourly rate
export function calculateSessionAmount(
  billableMs: number,
  ratePerHour: number
): number {
  const hours = msToBillableHours(billableMs);
  return hours * ratePerHour;
}

// ── Date Helpers ──────────────────────────────────────────────────────────────
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Bill Number Generator ─────────────────────────────────────────────────────
/// Generates a sequential, readable bill number: "BILL-20240801-0001"
export function generateBillNumber(sequence: number): string {
  const today = new Date();
  const dateStr = today
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const seq = sequence.toString().padStart(4, "0");
  return `${BILL_NUMBER_PREFIX}-${dateStr}-${seq}`;
}

// ── Type Guards ───────────────────────────────────────────────────────────────
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// ── API Response Helpers ──────────────────────────────────────────────────────
export function createSuccessResponse<T>(data: T, message?: string) {
  return { success: true, data, message } as const;
}

export function createErrorResponse(message: string, code?: string) {
  return { success: false, error: message, code } as const;
}
