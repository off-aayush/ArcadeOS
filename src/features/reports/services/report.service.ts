import { prisma } from "@/lib/prisma";
import { ReportData, ReportQueryParams } from "../types";
import { subDays, startOfDay, endOfDay, startOfMonth, format } from "date-fns";
import { STATION_TYPE_LABELS } from "@/lib/constants";

export class ReportService {
  /**
   * Retrieves dashboard report metrics including summary statistics,
   * a daily revenue trend, station-specific gaming revenue, and
   * inventory (food/drink) revenue — all within a date range.
   */
  static async getDashboardReport(params: ReportQueryParams = {}): Promise<ReportData> {
    // Default to current month if no dates provided
    const now = new Date();
    const endDate = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(now);
    const startDate = params.startDate
      ? startOfDay(new Date(params.startDate))
      : startOfMonth(now);

    // ── Fetch bills with all items and station info ───────────────────────────
    const bills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["PAID", "PARTIALLY_PAID"] },
      },
      select: {
        grandTotal: true,
        discountTotal: true,
        createdAt: true,
        items: {
          select: {
            type: true,
            description: true,
            totalPrice: true,
          },
        },
        session: {
          select: {
            station: {
              select: { type: true },
            },
          },
        },
      },
    });

    // ── Fetch sessions for usage stats ───────────────────────────────────────
    const sessions = await prisma.session.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate },
      },
      select: {
        customerId: true,
        station: { select: { type: true } },
      },
    });

    // ── Summary Stats ────────────────────────────────────────────────────────
    let totalRevenue = 0;
    let totalDiscounts = 0;
    bills.forEach((b) => {
      totalRevenue += Number(b.grandTotal);
      totalDiscounts += Number(b.discountTotal);
    });

    const totalSessions = sessions.length;
    const activeCustomers = new Set(
      sessions.filter((s) => s.customerId).map((s) => s.customerId)
    ).size;

    // ── Revenue Trend Chart (by day) ─────────────────────────────────────────
    const revenueByDay = new Map<string, number>();
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      revenueByDay.set(format(new Date(d), "MMM dd"), 0);
    }
    bills.forEach((b) => {
      const dayLabel = format(b.createdAt, "MMM dd");
      if (revenueByDay.has(dayLabel)) {
        revenueByDay.set(dayLabel, revenueByDay.get(dayLabel)! + Number(b.grandTotal));
      }
    });
    const revenueChart = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // ── Station Revenue (SESSION_TIME items only) ─────────────────────────────
    // Maps station type label → total revenue from gaming charges
    const stationRevenueMap = new Map<string, number>();
    bills.forEach((b) => {
      const stationType = b.session?.station?.type;
      if (!stationType) return;
      const label = STATION_TYPE_LABELS[stationType as keyof typeof STATION_TYPE_LABELS] ?? stationType;
      const gamingTotal = b.items
        .filter((item) => item.type === "SESSION_TIME")
        .reduce((sum, item) => sum + Number(item.totalPrice), 0);
      if (gamingTotal > 0) {
        stationRevenueMap.set(label, (stationRevenueMap.get(label) ?? 0) + gamingTotal);
      }
    });
    const stationRevenue = Array.from(stationRevenueMap.entries())
      .map(([type, revenue]) => ({ type, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Inventory Revenue (FOOD / DRINK items) ────────────────────────────────
    // Maps item description → total revenue from food/drink charges
    const inventoryRevenueMap = new Map<string, number>();
    bills.forEach((b) => {
      b.items
        .filter((item) => item.type === "FOOD" || item.type === "DRINK")
        .forEach((item) => {
          const name = item.description;
          inventoryRevenueMap.set(name, (inventoryRevenueMap.get(name) ?? 0) + Number(item.totalPrice));
        });
    });
    const inventoryRevenue = Array.from(inventoryRevenueMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      summary: {
        totalRevenue,
        totalSessions,
        totalDiscounts,
        activeCustomers,
      },
      revenueChart,
      stationRevenue,
      inventoryRevenue,
    };
  }
}
