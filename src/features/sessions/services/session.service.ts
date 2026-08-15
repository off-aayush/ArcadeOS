import { prisma } from "@/lib/prisma";
import { SessionWithContext, SessionQueryParams, StartSessionInput } from "../types";
import { Prisma, Session } from "@prisma/client";
import { DEFAULT_PAGE_SIZE, MIN_BILLABLE_MS } from "@/lib/constants";

// System user ID used when no auth is present yet (Phase 4 placeholder — replaced in Phase 9)
const SYSTEM_USER_ID_KEY = "system_user_id";
import { getAuthUser } from "@/lib/auth";

/**
 * Helper to get the current user ID for auditing/recording actions.
 * Falls back to the first user if not in a request context.
 */
async function getSystemUserId(): Promise<string> {
  try {
    const authUser = await getAuthUser();
    if (authUser) return authUser.id;
  } catch {
    // Ignore context errors
  }
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No users exist in the system");
  return user.id;
}

import { emitSocketEvent } from "@/lib/socket-emitter";

// --- Session include shape (reused across all queries) ---
const SESSION_INCLUDE = {
  station: { select: { id: true, name: true, type: true } },
  customer: { select: { id: true, name: true, phone: true } },
  startedBy: { select: { id: true, name: true } },
  stoppedBy: { select: { id: true, name: true } },
  bill: { select: { id: true, status: true, grandTotal: true } },
} satisfies Prisma.SessionInclude;

export class SessionService {
  /**
   * List sessions with optional filters and pagination.
   */
  static async getAll(params: SessionQueryParams = {}): Promise<{ sessions: SessionWithContext[]; total: number }> {
    const {
      status = "ALL",
      stationId,
      customerId,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = params;

    const where: Prisma.SessionWhereInput = {};
    if (status !== "ALL") where.status = status;
    if (stationId) where.stationId = stationId;
    if (customerId) where.customerId = customerId;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: SESSION_INCLUDE,
        orderBy: { startTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.session.count({ where }),
    ]);

    return { sessions: sessions as SessionWithContext[], total };
  }

  /**
   * Fetch a single session by ID.
   */
  static async getById(id: string): Promise<SessionWithContext | null> {
    const session = await prisma.session.findUnique({
      where: { id },
      include: SESSION_INCLUDE,
    });
    return session as SessionWithContext | null;
  }

  /**
   * Start a new session on a station.
   * Validates station availability and captures the pricing snapshot.
   */
  static async start(input: StartSessionInput): Promise<SessionWithContext> {
    const { stationId, customerId, playerCount = 1, notes } = input;

    // Fetch station with current active sessions
    const station = await prisma.station.findFirst({
      where: { id: stationId, isActive: true, deletedAt: null },
      include: { sessions: { where: { status: { in: ["ACTIVE", "PAUSED"] } } } },
    });

    if (!station) throw new Error("Station not found or inactive");
    if (station.status !== "AVAILABLE") {
      throw new Error(`Station is currently ${station.status.toLowerCase()} and cannot be started`);
    }
    if (station.sessions.length > 0) {
      throw new Error("Station already has an active session");
    }

    const actorId = await getSystemUserId();

    // Run station update + session creation atomically
    const [, session] = await prisma.$transaction([
      // Mark station as OCCUPIED
      prisma.station.update({
        where: { id: stationId },
        data: { status: "OCCUPIED" },
      }),
      // Create the session with a pricing snapshot
      prisma.session.create({
        data: {
          stationId,
          customerId: customerId || null,
          startedById: actorId,
          ratePerHour: station.ratePerHour,
          pricingModel: station.pricingModel,
          playerCount,
          notes,
          status: "ACTIVE",
        },
        include: SESSION_INCLUDE,
      }),
    ]);

    emitSocketEvent("invalidate_sessions");
    emitSocketEvent("invalidate_stations");

    return session as SessionWithContext;
  }

  /**
   * Pause a running session. Captures the pause timestamp.
   */
  static async pause(id: string): Promise<SessionWithContext> {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) throw new Error("Session not found");
    if (session.status !== "ACTIVE") throw new Error("Only ACTIVE sessions can be paused");

    const updated = await prisma.session.update({
      where: { id },
      data: { status: "PAUSED", pausedAt: new Date() },
      include: SESSION_INCLUDE,
    });

    emitSocketEvent("invalidate_sessions");

    return updated as SessionWithContext;
  }

  /**
   * Resume a paused session. Accumulates the paused duration.
   */
  static async resume(id: string): Promise<SessionWithContext> {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) throw new Error("Session not found");
    if (session.status !== "PAUSED") throw new Error("Only PAUSED sessions can be resumed");
    if (!session.pausedAt) throw new Error("Session has no pause timestamp");

    const additionalPausedMs = Date.now() - new Date(session.pausedAt).getTime();

    const updated = await prisma.session.update({
      where: { id },
      data: {
        status: "ACTIVE",
        pausedAt: null,
        totalPausedMs: { increment: additionalPausedMs },
      },
      include: SESSION_INCLUDE,
    });

    emitSocketEvent("invalidate_sessions");

    return updated as SessionWithContext;
  }

  /**
   * Stop a session and free the station.
   * Calculates final billable time and marks the station AVAILABLE.
   */
  static async stop(id: string): Promise<SessionWithContext> {
    const session = await prisma.session.findUnique({
      where: { id },
      include: { station: true },
    });
    if (!session) throw new Error("Session not found");
    if (session.status !== "ACTIVE" && session.status !== "PAUSED") {
      throw new Error("Session is already completed or cancelled");
    }

    const now = new Date();
    let finalPausedMs = session.totalPausedMs;

    // If currently paused, add the current pause duration
    if (session.status === "PAUSED" && session.pausedAt) {
      finalPausedMs += now.getTime() - new Date(session.pausedAt).getTime();
    }

    const actorId = await getSystemUserId();

    const [, updated] = await prisma.$transaction([
      // Free the station
      prisma.station.update({
        where: { id: session.stationId },
        data: { status: "AVAILABLE" },
      }),
      // Complete the session
      prisma.session.update({
        where: { id },
        data: {
          status: "COMPLETED",
          endTime: now,
          pausedAt: null,
          totalPausedMs: finalPausedMs,
          stoppedById: actorId,
        },
        include: SESSION_INCLUDE,
      }),
    ]);

    emitSocketEvent("invalidate_sessions");
    emitSocketEvent("invalidate_stations");

    return updated as SessionWithContext;
  }

  /**
   * Cancel a session (e.g. error correction — no bill generated).
   */
  static async cancel(id: string): Promise<SessionWithContext> {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) throw new Error("Session not found");
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      throw new Error("Session is already finalized");
    }

    const [, updated] = await prisma.$transaction([
      prisma.station.update({
        where: { id: session.stationId },
        data: { status: "AVAILABLE" },
      }),
      prisma.session.update({
        where: { id },
        data: { status: "CANCELLED", endTime: new Date() },
        include: SESSION_INCLUDE,
      }),
    ]);

    emitSocketEvent("invalidate_sessions");
    emitSocketEvent("invalidate_stations");

    return updated as SessionWithContext;
  }
}
