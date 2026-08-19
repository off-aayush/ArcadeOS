// ─────────────────────────────────────────────────────────────────────────────
// Reports Module - Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportSummary {
  totalRevenue: number;
  totalSessions: number;
  totalDiscounts: number;
  activeCustomers: number;
}

export interface RevenueChartData {
  date: string;       // e.g. "2024-08-01" or a localized string "1 Aug"
  revenue: number;
}

/** Station revenue from SESSION_TIME bill items only (no food/drinks) */
export interface StationRevenueData {
  type: string;       // e.g. "PS5", "PC"
  revenue: number;
}

/** Inventory (food/drink) revenue from FOOD/DRINK bill items */
export interface InventoryRevenueData {
  name: string;       // e.g. "Pepsi", "Burger"
  revenue: number;
}

export interface ReportData {
  summary: ReportSummary;
  revenueChart: RevenueChartData[];
  stationRevenue: StationRevenueData[];
  inventoryRevenue: InventoryRevenueData[];
}

export interface ReportQueryParams {
  startDate?: string; // ISO String
  endDate?: string;   // ISO String
}
