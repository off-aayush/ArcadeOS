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

export interface StationUsageData {
  type: string;       // e.g. "PS5", "PC"
  sessions: number;
}

export interface ReportData {
  summary: ReportSummary;
  revenueChart: RevenueChartData[];
  stationUsage: StationUsageData[];
}

export interface ReportQueryParams {
  startDate?: string; // ISO String
  endDate?: string;   // ISO String
}
