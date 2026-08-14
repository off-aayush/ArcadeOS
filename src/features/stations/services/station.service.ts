import { prisma } from "@/lib/prisma";
import { StationQueryParams, StationListItem } from "../types";
import { DashboardStats } from "@/types";
import { Prisma, Station } from "@prisma/client";

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
   * Retrieves a single station by its ID, with active sessions.
   */
  static async getById(id: string): Promise<StationListItem | null> {
    const station = await prisma.station.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
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
    });
    return station as StationListItem | null;
  }

  /**
   * Creates a new station in the database.
   */
  static async create(data: Omit<Prisma.StationCreateInput, "status">): Promise<Station> {
    return prisma.station.create({
      data: {
        ...data,
        status: "AVAILABLE",
      },
    });
  }

  /**
   * Updates an existing station. Protects occupied stations from being set to maintenance or offline.
   */
  static async update(id: string, data: Prisma.StationUpdateInput): Promise<Station> {
    const current = await prisma.station.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!current) {
      throw new Error("Station not found");
    }

    // Business Logic: Active session validation
    if (current.sessions.length > 0) {
      if (data.status && data.status !== "OCCUPIED") {
        throw new Error("Cannot change status of a station with an active session");
      }
      if (data.isActive === false) {
        throw new Error("Cannot deactivate a station with an active session");
      }
    }

    return prisma.station.update({
      where: { id },
      data,
    });
  }

  /**
   * Performs soft deletion on a station to preserve historical session data.
   */
  static async delete(id: string): Promise<Station> {
    const current = await prisma.station.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!current) {
      throw new Error("Station not found");
    }

    if (current.sessions.length > 0) {
      throw new Error("Cannot delete a station with an active session");
    }

    return prisma.station.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves dashboard stats (station occupancy, total counts, revenue placeholders)
   */
  static async getStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, available, occupied, maintenance, activeSessions, bills, todaySessions] = await Promise.all([
      prisma.station.count({ where: { isActive: true, deletedAt: null } }),
      prisma.station.count({ where: { isActive: true, deletedAt: null, status: "AVAILABLE" } }),
      prisma.station.count({ where: { isActive: true, deletedAt: null, status: "OCCUPIED" } }),
      prisma.station.count({ where: { isActive: true, deletedAt: null, status: "MAINTENANCE" } }),
      prisma.session.count({ where: { status: "ACTIVE" } }),
      prisma.bill.findMany({ 
        where: { 
          createdAt: { gte: today }, 
          status: { in: ["PAID", "PARTIALLY_PAID"] } 
        } 
      }),
      prisma.session.findMany({
        where: {
          startTime: { gte: today }
        },
        select: { customerId: true, totalPausedMs: true, startTime: true, endTime: true, status: true }
      })
    ]);

    const todayRevenue = bills.reduce((sum, b) => sum + Number(b.grandTotal), 0);
    const todayCustomers = new Set(todaySessions.filter(s => s.customerId).map(s => s.customerId)).size;

    let totalDurationMs = 0;
    let completedCount = 0;
    todaySessions.forEach(s => {
      if (s.status === "COMPLETED" && s.endTime) {
        totalDurationMs += s.endTime.getTime() - s.startTime.getTime() - s.totalPausedMs;
        completedCount++;
      }
    });
    const avgSessionDurationMs = completedCount > 0 ? totalDurationMs / completedCount : 0;

    return {
      totalStations: total,
      availableStations: available,
      occupiedStations: occupied,
      maintenanceStations: maintenance,
      activeSessions,
      todayRevenue,
      todayCustomers,
      avgSessionDurationMs,
    };
  }
}
