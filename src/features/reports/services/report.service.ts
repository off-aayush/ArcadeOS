import { prisma } from "@/lib/prisma";
import { ReportData, ReportQueryParams } from "../types";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { STATION_TYPE_LABELS } from "@/lib/constants";

export class ReportService {
  /**
   * Retrieves dashboard report metrics including summary statistics, 
   * a daily revenue trend, and station usage distribution within a date range.
   */
  static async getDashboardReport(params: ReportQueryParams = {}): Promise<ReportData> {
    // Default to the last 7 days if no dates are provided
    const endDate = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(new Date());
    const startDate = params.startDate ? startOfDay(new Date(params.startDate)) : startOfDay(subDays(endDate, 6));

    // 1. Fetch relevant bills for revenue calculation
    // Considering PAID and PARTIALLY_PAID for realized revenue
    const bills = await prisma.bill.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ["PAID", "PARTIALLY_PAID"] }
      },
      select: {
        grandTotal: true,
        discountTotal: true,
        createdAt: true,
      }
    });

    // 2. Fetch sessions for usage statistics
    const sessions = await prisma.session.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        }
      },
      select: {
        customerId: true,
        station: {
          select: {
            type: true
          }
        }
      }
    });

    // ── Calculate Summary Stats ───────────────────────────────────────────────
    let totalRevenue = 0;
    let totalDiscounts = 0;
    bills.forEach(b => {
      totalRevenue += Number(b.grandTotal);
      totalDiscounts += Number(b.discountTotal);
    });

    const totalSessions = sessions.length;
    
    // Count unique registered customers who played during this period
    const activeCustomers = new Set(
      sessions.filter(s => s.customerId).map(s => s.customerId)
    ).size;

    // ── Prepare Revenue Chart Data (Grouped by Day) ───────────────────────────
    const revenueByDay = new Map<string, number>();
    
    // Initialize all dates in range with 0 revenue
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      revenueByDay.set(format(d, "MMM dd"), 0);
    }

    // Populate with actual revenue
    bills.forEach(b => {
      const dayLabel = format(b.createdAt, "MMM dd");
      if (revenueByDay.has(dayLabel)) {
        revenueByDay.set(dayLabel, revenueByDay.get(dayLabel)! + Number(b.grandTotal));
      }
    });

    const revenueChart = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
      date,
      revenue
    }));

    // ── Prepare Station Usage Data ────────────────────────────────────────────
    const usageMap = new Map<string, number>();
    
    // Initialize all known station types with 0
    Object.values(STATION_TYPE_LABELS).forEach(label => {
      usageMap.set(label, 0);
    });

    sessions.forEach(s => {
      const label = STATION_TYPE_LABELS[s.station.type] || s.station.type;
      usageMap.set(label, (usageMap.get(label) || 0) + 1);
    });

    const stationUsage = Array.from(usageMap.entries())
      .filter(([type, count]) => count > 0 || usageMap.size > 0) // Always show items, or at least we have data
      .map(([type, count]) => ({
      type,
      sessions: count
    })).sort((a, b) => b.sessions - a.sessions); // Largest segments first

    return {
      summary: {
        totalRevenue,
        totalSessions,
        totalDiscounts,
        activeCustomers,
      },
      revenueChart,
      stationUsage
    };
  }
}
