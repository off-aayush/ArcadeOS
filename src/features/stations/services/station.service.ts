import { prisma } from "@/lib/prisma";
import { StationQueryParams, StationListItem } from "../types";
import { DashboardStats } from "@/types";

export class StationService {
  /**
   * Retrieves all stations matching the query filters, including active sessions.
   */
  static async getAll(params: StationQueryParams = {}): Promise<StationListItem[]> {
    const { status, type, search } = params;

    const whereClause: any = {
      isActive: true,
      deletedAt: null,
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const stations = await prisma.station.findMany({
      where: whereClause,
      include: {
        sessions: {
          where: {
            status: "ACTIVE",
          },
          include: {
            customer: true,
            startedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return stations as StationListItem[];
  }

  /**
   * Retrieves dashboard stats (station occupancy, total counts, revenue placeholders)
   */
  static async getStats(): Promise<DashboardStats> {
    const [total, available, occupied, maintenance, activeSessions] = await Promise.all([
      prisma.station.count({ where: { isActive: true, deletedAt: null } }),
      prisma.station.count({ where: { isActive: true, deletedAt: null, status: "AVAILABLE" } }),
      prisma.station.count({ where: { isActive: true, deletedAt: null, status: "OCCUPIED" } }),
      prisma.station.count({ where: { isActive: true, deletedAt: null, status: "MAINTENANCE" } }),
      prisma.session.count({ where: { status: "ACTIVE" } }),
    ]);

    // Revenue calculations will be computed dynamically in the billing phase.
    // For now, return default stats with real counts.
    return {
      totalStations: total,
      availableStations: available,
      occupiedStations: occupied,
      maintenanceStations: maintenance,
      activeSessions,
      todayRevenue: 0,
      todayCustomers: 0,
      avgSessionDurationMs: 0,
    };
  }
}
