// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — Global TypeScript Types
// Re-exports Prisma-generated types and adds application-level type helpers.
//
// WHY: Prisma generates types from the schema. We re-export and extend them
// here so that the rest of the app always imports from one canonical location.
// This makes schema changes easier to propagate (single point to update).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Station,
  Customer,
  Session,
  Bill,
  BillItem,
  FoodItem,
  Discount,
  Membership,
  Payment,
  User,
  Role,
  AuditLog,
  StationType,
  StationStatus,
  SessionStatus,
  BillStatus,
  BillItemType,
  DiscountType,
  FoodCategory,
  PaymentMethod,
  PaymentStatus,
  Permission,
  AuditAction,
  MembershipTier,
  PricingModel,
  Gender,
  StationPricing,
} from "@prisma/client";

// Re-export all Prisma types
export type {
  Station,
  Customer,
  Session,
  Bill,
  BillItem,
  FoodItem,
  Discount,
  Membership,
  Payment,
  User,
  Role,
  AuditLog,
  StationType,
  StationStatus,
  SessionStatus,
  BillStatus,
  BillItemType,
  DiscountType,
  FoodCategory,
  PaymentMethod,
  PaymentStatus,
  Permission,
  AuditAction,
  MembershipTier,
  PricingModel,
  Gender,
  StationPricing,
};

// ── API Response Wrapper ──────────────────────────────────────────────────────
export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Paginated Response ────────────────────────────────────────────────────────
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ── Common Query Params ───────────────────────────────────────────────────────
export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export type SortParams<T extends string = string> = {
  sortBy?: T;
  sortOrder?: "asc" | "desc";
};

// ── Station with Active Session ───────────────────────────────────────────────
/// Used by the dashboard — station card shows live session info
export type ActiveSession = Session & {
  customer: Customer | null;
  startedBy: Pick<User, "id" | "name">;
};

export type StationWithSession = Station & {
  sessions: ActiveSession[];
};

// ── Bill with Full Details ────────────────────────────────────────────────────
export type BillItemWithRefs = BillItem & {
  foodItem: FoodItem | null;
  discount: Discount | null;
};

export type BillWithDetails = Bill & {
  items: BillItemWithRefs[];
  payments: Payment[];
  session: Session & {
    station: Station;
    customer: Customer | null;
  };
  issuedBy: Pick<User, "id" | "name">;
};

// ── Session with Full Context ─────────────────────────────────────────────────
export type SessionWithContext = Session & {
  station: Station;
  customer: Customer | null;
  startedBy: Pick<User, "id" | "name">;
  bill: Pick<Bill, "id" | "billNumber" | "status" | "grandTotal"> | null;
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export type DashboardStats = {
  totalStations: number;
  availableStations: number;
  occupiedStations: number;
  maintenanceStations: number;
  activeSessions: number;
  todayRevenue: number;
  todayCustomers: number;
  avgSessionDurationMs: number;
};

// ── Utility Types ─────────────────────────────────────────────────────────────
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybePromise<T> = T | Promise<T>;

/// Make specific keys of T required
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/// Make specific keys of T optional
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
