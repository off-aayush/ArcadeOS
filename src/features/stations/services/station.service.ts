import { prisma } from "@/lib/prisma";
import { StationQueryParams, StationListItem } from "../types";
import { DashboardStats } from "@/types";
import { Prisma, Station } from "@prisma/client";
import { emitSocketEvent } from "@/lib/socket-emitter";
import { AuditLogService } from "@/features/audit-logs/services/audit.service";

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
            status: { in: ["ACTIVE", "PAUSED"] },
          },
          include: {
            customer: true,
            startedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            bill: {
              select: {
                id: true,
                status: true,
                grandTotal: true,
              },
            },
          },
        },
        pricings: {
          where: { isActive: true },
          orderBy: { playerCount: "asc" },
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
            status: { in: ["ACTIVE", "PAUSED"] },
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
        pricings: {
          where: { isActive: true },
          orderBy: { playerCount: "asc" },
        },
      },
    });
    return station as StationListItem | null;
  }

  /**
   * Creates a new station in the database.
   */
  static async create(
    data: Omit<Prisma.StationCreateInput, "status"> & { pricings?: { playerCount: number; ratePerHour: number; ratePerMinute?: number | null }[] },
    actorId: string | null = null
  ): Promise<Station> {
    const { pricings, ...stationData } = data;
    
    const station = await prisma.$transaction(async (tx) => {
      const newStation = await tx.station.create({
        data: {
          ...stationData,
          status: "AVAILABLE",
        },
      });

      if (pricings && pricings.length > 0) {
        await this.upsertPricings(newStation.id, newStation.maxPlayers, pricings, tx);
      } else {
        // Fallback: create a 1-player pricing based on ratePerHour
        await tx.stationPricing.create({
          data: {
            stationId: newStation.id,
            playerCount: 1,
            ratePerHour: newStation.ratePerHour,
            ratePerMinute: newStation.ratePerMinute,
          },
        });
      }
      return newStation;
    });


    emitSocketEvent("invalidate_stations");
    
    await AuditLogService.log("CREATE", "Station", station.id, actorId, {
      name: station.name,
      type: station.type,
      pricings: pricings?.length || 0
    });
    
    return station;
  }

  /**
   * Updates an existing station. Protects occupied stations from being set to maintenance or offline.
   */
  static async update(id: string, data: Prisma.StationUpdateInput, actorId: string | null = null): Promise<Station> {
    const current = await prisma.station.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { status: { in: ["ACTIVE", "PAUSED"] } },
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

    const { pricings, ...updateData } = data as any; // Cast because data type might not include pricings in Prisma.StationUpdateInput

    const updated = await prisma.$transaction(async (tx) => {
      const updatedStation = await tx.station.update({
        where: { id },
        data: updateData,
      });

      if (pricings) {
        await this.upsertPricings(id, updatedStation.maxPlayers, pricings, tx);
      }

      return updatedStation;
    });
    
    emitSocketEvent("invalidate_stations");

    await AuditLogService.log("UPDATE", "Station", id, actorId, {
      name: updated.name,
      previousStatus: current.status,
      newStatus: updated.status,
      fieldsUpdated: Object.keys(data).filter(k => k !== "pricings")
    });

    return updated;
  }

  /**
   * Performs soft deletion on a station to preserve historical session data.
   */
  static async delete(id: string, actorId: string | null = null): Promise<Station> {
    const current = await prisma.station.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { status: { in: ["ACTIVE", "PAUSED"] } },
        },
      },
    });

    if (!current) {
      throw new Error("Station not found");
    }

    if (current.sessions.length > 0) {
      throw new Error("Cannot delete a station with an active session");
    }

    const deleted = await prisma.station.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
    emitSocketEvent("invalidate_stations");

    await AuditLogService.log("DELETE", "Station", id, actorId, {
      name: current.name
    });

    return deleted;
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

  /**
   * Private helper to upsert pricings and deactivate invalid ones.
   */
  private static async upsertPricings(
    stationId: string, 
    maxPlayers: number, 
    pricings: { playerCount: number; ratePerHour: number; ratePerMinute?: number | null }[],
    tx: Prisma.TransactionClient
  ) {
    // 1. Deactivate any pricing where playerCount > maxPlayers
    await tx.stationPricing.updateMany({
      where: {
        stationId,
        playerCount: { gt: maxPlayers }
      },
      data: { isActive: false }
    });

    // 2. Upsert provided pricings (up to maxPlayers)
    for (const p of pricings) {
      if (p.playerCount > maxPlayers) continue; // safety check
      
      await tx.stationPricing.upsert({
        where: { stationId_playerCount: { stationId, playerCount: p.playerCount } },
        update: {
          ratePerHour: p.ratePerHour,
          ratePerMinute: p.ratePerMinute ?? null,
          isActive: true,
        },
        create: {
          stationId,
          playerCount: p.playerCount,
          ratePerHour: p.ratePerHour,
          ratePerMinute: p.ratePerMinute ?? null,
          isActive: true,
        },
      });
    }
  }
}
