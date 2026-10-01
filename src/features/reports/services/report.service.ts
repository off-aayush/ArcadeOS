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
            manualAdjustmentType: true,
          },
        },
        session: {
          select: {
            station: {
              select: { type: true },
            },
          },
        },
        payments: {
          where: { status: "COMPLETED" },
          select: { method: true, amount: true },
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
    // We will aggregate these down below inside the main loop

    const totalSessions = sessions.length;
    const activeCustomers = new Set(
      sessions.filter((s) => s.customerId).map((s) => s.customerId)
    ).size;

    // ── Revenue Trend Chart (by day) ─────────────────────────────────────────
    const revenueByDay = new Map<string, number>();
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      revenueByDay.set(format(new Date(d), "MMM dd"), 0);
    }

    // ── Station Revenue (SESSION_TIME items only) ─────────────────────────────
    // Maps station type label → total revenue from gaming charges
    const stationRevenueMap = new Map<string, number>();
    
    // ── Inventory Revenue (FOOD / DRINK items) ────────────────────────────────
    // Maps item description → total revenue from food/drink charges
    const inventoryRevenueMap = new Map<string, number>();


    // ── Manual Adjustments (MANUAL_CREDIT / MANUAL_CHARGE) ────────────────────
    let totalCredits = 0;
    let totalCharges = 0;
    let creditCount = 0;
    let chargeCount = 0;
    let totalAdjustmentCount = 0;

    const categories = ["ADJUSTMENTS", "FRIENDS", "ROUND_OFF", "OTHERS"] as const;
    const categoryLabels: Record<string, string> = {
      ADJUSTMENTS: "Adjustments",
      FRIENDS: "Friends",
      ROUND_OFF: "Round Off",
      OTHERS: "Others"
    };

    const byCategoryMap = new Map(categories.map(c => [c, { category: c, label: categoryLabels[c], creditAmount: 0, chargeAmount: 0, count: 0 }]));

    bills.forEach((b) => {
      let multiplier = 1; // Default for "ALL"
      let isIncluded = true;
      let matchingPaymentAmount = 0;
      const grandTotal = Number(b.grandTotal);

      if (params.paymentMode && params.paymentMode !== "ALL") {
        matchingPaymentAmount = b.payments
          .filter((p) => p.method === params.paymentMode)
          .reduce((sum, p) => sum + Number(p.amount), 0);

        if (matchingPaymentAmount === 0) {
          isIncluded = false;
        } else {
          multiplier = grandTotal > 0 ? matchingPaymentAmount / grandTotal : 0;
        }
      }

      if (!isIncluded) return;

      // 1. Summary
      if (params.paymentMode && params.paymentMode !== "ALL") {
        totalRevenue += matchingPaymentAmount;
        totalDiscounts += Number(b.discountTotal) * multiplier;
      } else {
        totalRevenue += grandTotal;
        totalDiscounts += Number(b.discountTotal);
      }

      // 2. Trend
      const dayLabel = format(b.createdAt, "MMM dd");
      if (revenueByDay.has(dayLabel)) {
        const addedRevenue = (params.paymentMode && params.paymentMode !== "ALL") ? matchingPaymentAmount : grandTotal;
        revenueByDay.set(dayLabel, revenueByDay.get(dayLabel)! + addedRevenue);
      }

      // 3. Station Revenue
      const stationType = b.session?.station?.type;
      if (stationType) {
        const label = STATION_TYPE_LABELS[stationType as keyof typeof STATION_TYPE_LABELS] ?? stationType;
        const gamingTotal = b.items
          .filter((item) => item.type === "SESSION_TIME")
          .reduce((sum, item) => sum + Number(item.totalPrice), 0);
        if (gamingTotal > 0) {
          stationRevenueMap.set(label, (stationRevenueMap.get(label) ?? 0) + (gamingTotal * multiplier));
        }
      }

      // 4. Inventory Revenue
      b.items
        .filter((item) => item.type === "FOOD" || item.type === "DRINK")
        .forEach((item) => {
          const name = item.description;
          inventoryRevenueMap.set(name, (inventoryRevenueMap.get(name) ?? 0) + (Number(item.totalPrice) * multiplier));
        });

      // 5. Manual Adjustments
      b.items.forEach((item) => {
        if (item.type === "MANUAL_CREDIT" || item.type === "MANUAL_CHARGE") {
          totalAdjustmentCount++;
          const amount = Math.abs(Number(item.totalPrice)) * multiplier;

          const catKey = (item.manualAdjustmentType as any) || "OTHERS";
          const catData = byCategoryMap.get(catKey);

          if (item.type === "MANUAL_CREDIT") {
            totalCredits += amount;
            if (multiplier > 0) creditCount++;
            if (catData) catData.creditAmount += amount;
          } else {
            totalCharges += amount;
            if (multiplier > 0) chargeCount++;
            if (catData) catData.chargeAmount += amount;
          }
          if (catData && multiplier > 0) catData.count++;
        }
      });
    });

    const revenueChart = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    const stationRevenue = Array.from(stationRevenueMap.entries())
      .map(([type, revenue]) => ({ type, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    const inventoryRevenue = Array.from(inventoryRevenueMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    const netAdjustment = totalCharges - totalCredits;

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
      manualAdjustments: {
        totalCredits,
        totalCharges,
        netAdjustment,
        creditCount,
        chargeCount,
        totalCount: totalAdjustmentCount,
        byCategory: Array.from(byCategoryMap.values()),
      },
    };
  }
}
