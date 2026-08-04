// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — Application-wide Constants
// All magic numbers and shared strings live here, never inline.
// ─────────────────────────────────────────────────────────────────────────────

// ── App Identity ──────────────────────────────────────────────────────────────
export const APP_NAME = "ArcadeOS";
export const APP_VERSION = "1.0.0";

// ── Currency ──────────────────────────────────────────────────────────────────
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "INR";
export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "₹";

// ── Billing ───────────────────────────────────────────────────────────────────
/// Bill numbers are generated as e.g. "BILL-20240801-0001"
export const BILL_NUMBER_PREFIX = "BILL";

/// Rounding target — bills are rounded to the nearest ₹1 by default
export const ROUNDING_PRECISION = 0; // decimal places

/// Maximum manual discount a receptionist can apply without admin override (%)
export const MAX_RECEPTIONIST_DISCOUNT_PCT = 25;

// ── Session ───────────────────────────────────────────────────────────────────
/// Minimum billable duration in milliseconds (5 minutes)
export const MIN_BILLABLE_MS = 5 * 60 * 1000;

/// How often the live timer UI ticks (milliseconds)
export const TIMER_TICK_MS = 1000;

/// After this many minutes idle with status RESERVED, auto-release the station
export const RESERVATION_EXPIRY_MINUTES = 15;

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── TanStack Query Cache Times ────────────────────────────────────────────────
/// Station list: fresh for 10 seconds (near-realtime dashboard)
export const STATION_STALE_TIME = 10 * 1000;

/// Customer data: fresh for 1 minute
export const CUSTOMER_STALE_TIME = 60 * 1000;

/// Reports/analytics: fresh for 5 minutes
export const REPORT_STALE_TIME = 5 * 60 * 1000;

// ── Station Status Colors (Tailwind class names) ──────────────────────────────
export const STATION_STATUS_STYLES = {
  AVAILABLE:   { bg: "bg-success/20",  text: "text-success",  border: "border-success/40",  glow: "shadow-glow-success" },
  OCCUPIED:    { bg: "bg-danger/20",   text: "text-danger",   border: "border-danger/40",   glow: "shadow-glow-danger"  },
  MAINTENANCE: { bg: "bg-warning/20",  text: "text-warning",  border: "border-warning/40",  glow: ""                   },
  RESERVED:    { bg: "bg-brand/20",    text: "text-brand",    border: "border-brand/40",    glow: "shadow-glow-brand"  },
  OFFLINE:     { bg: "bg-surface-border/20", text: "text-surface-muted", border: "border-surface-border", glow: "" },
} as const;

// ── Station Type Labels ───────────────────────────────────────────────────────
export const STATION_TYPE_LABELS = {
  PS5:              "PlayStation 5",
  PS4:              "PlayStation 4",
  PC:               "Gaming PC",
  RACING_SIMULATOR: "Racing Simulator",
  VR:               "VR Station",
  XBOX:             "Xbox",
  SWITCH:           "Nintendo Switch",
  OTHER:            "Other",
} as const;

// ── Membership Tier Colors ────────────────────────────────────────────────────
export const MEMBERSHIP_TIER_STYLES = {
  BRONZE:   { color: "text-amber-600",   bg: "bg-amber-600/20"   },
  SILVER:   { color: "text-slate-400",   bg: "bg-slate-400/20"   },
  GOLD:     { color: "text-yellow-400",  bg: "bg-yellow-400/20"  },
  PLATINUM: { color: "text-cyan-400",    bg: "bg-cyan-400/20"    },
} as const;

// ── API Routes ────────────────────────────────────────────────────────────────
export const API_ROUTES = {
  stations:  "/api/stations",
  customers: "/api/customers",
  sessions:  "/api/sessions",
  bills:     "/api/bills",
  food:      "/api/food",
  discounts: "/api/discounts",
  payments:  "/api/payments",
  users:     "/api/users",
  reports:   "/api/reports",
} as const;
