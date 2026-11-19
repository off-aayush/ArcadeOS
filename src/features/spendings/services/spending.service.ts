import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SpendingCreateInput, SpendingInput, SpendingListQuery, SpendingRange } from "../validators";
import type { SpendingTrend } from "../types";

const SPENDING_INCLUDE = {
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
} satisfies Prisma.SpendingInclude;

export class SpendingForbiddenError extends Error {
  constructor() {
    super("Super Admin access required");
  }
}

export class SpendingNotFoundError extends Error {
  constructor() {
    super("Spending not found");
  }
}

export class SpendingConflictError extends Error {
  constructor() {
    super("This request key belongs to a different spending");
  }
}

export class SpendingService {
  private static async requireSuperAdmin(actorId: string) {
    const user = await prisma.user.findFirst({
      where: { id: actorId, isActive: true, deletedAt: null, role: { name: "SUPER_ADMIN" } },
      select: { id: true },
    });
    if (!user) throw new SpendingForbiddenError();
  }

  private static async getTimezone() {
    const profile = await prisma.parlourProfile.findUnique({
      where: { id: "singleton" },
      select: { timezone: true },
    });
    let timezone = profile?.timezone || "Asia/Kolkata";
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
    } catch {
      timezone = "Asia/Kolkata";
    }
    return timezone;
  }

  private static async getRange(range: SpendingRange) {
    const timezone = await this.getTimezone();
    const [bounds] = await prisma.$queryRaw<{ start: Date; end: Date }[]>`
      SELECT (${range.startDate}::date::timestamp AT TIME ZONE ${timezone} AT TIME ZONE 'UTC') AS start,
             ((${range.endDate}::date + 1)::timestamp AT TIME ZONE ${timezone} AT TIME ZONE 'UTC') AS end
    `;
    return { ...bounds, timezone };
  }

  static async list(actorId: string, query: SpendingListQuery) {
    await this.requireSuperAdmin(actorId);
    const { start, end } = await this.getRange(query);
    const where = { spentAt: { gte: start, lt: end } };
    const [records, total] = await Promise.all([
      prisma.spending.findMany({
        where,
        include: SPENDING_INCLUDE,
        orderBy: [{ spentAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.spending.count({ where }),
    ]);
    return { records, total };
  }

  static async trend(actorId: string, range: SpendingRange): Promise<SpendingTrend> {
    await this.requireSuperAdmin(actorId);
    const timezone = await this.getTimezone();
    const days = Math.round(
      (Date.parse(`${range.endDate}T00:00:00Z`) -
        Date.parse(`${range.startDate}T00:00:00Z`)) / 86400000,
    ) + 1;
    const groupBy = days <= 31 ? "day" : days <= 180 ? "week" : "month";
    const rows = await prisma.$queryRaw<{ date: string; amount: Prisma.Decimal }[]>`
      SELECT to_char(date_trunc(${groupBy}::text,
                    "spentAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone}), 'YYYY-MM-DD') AS date,
             SUM("amount") AS amount
      FROM "spendings"
      WHERE "spentAt" >= (${range.startDate}::date::timestamp AT TIME ZONE ${timezone} AT TIME ZONE 'UTC')
        AND "spentAt" < ((${range.endDate}::date + 1)::timestamp AT TIME ZONE ${timezone} AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1
    `;
    return {
      groupBy,
      points: rows.map((row) => ({ date: row.date, amount: Number(row.amount) })),
      total: rows.reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0)).toFixed(2),
    };
  }

  static async create(actorId: string, input: SpendingCreateInput) {
    await this.requireSuperAdmin(actorId);
    const requestedAmount = new Prisma.Decimal(input.amount);
    const requestedDate = new Date(input.spentAt);
    const existing = await prisma.spending.findUnique({
      where: { requestKey: input.requestKey },
      include: SPENDING_INCLUDE,
    });
    if (existing) {
      if (existing.createdById !== actorId || existing.name !== input.name ||
          existing.description !== (input.description || null) ||
          existing.paymentMethod !== input.paymentMethod ||
          !existing.amount.equals(requestedAmount) ||
          existing.spentAt.getTime() !== requestedDate.getTime()) {
        throw new SpendingConflictError();
      }
      return existing;
    }
    try {
      return await prisma.spending.create({
        data: {
          requestKey: input.requestKey,
          name: input.name,
          description: input.description || null,
          amount: requestedAmount,
          paymentMethod: input.paymentMethod,
          spentAt: requestedDate,
          createdById: actorId,
          updatedById: actorId,
        },
        include: SPENDING_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const replay = await prisma.spending.findUnique({
          where: { requestKey: input.requestKey },
          include: SPENDING_INCLUDE,
        });
        if (replay && replay.createdById === actorId && replay.name === input.name &&
            replay.description === (input.description || null) &&
            replay.paymentMethod === input.paymentMethod &&
            replay.amount.equals(requestedAmount) &&
            replay.spentAt.getTime() === requestedDate.getTime()) return replay;
        throw new SpendingConflictError();
      }
      throw error;
    }
  }

  static async update(actorId: string, id: string, input: SpendingInput) {
    await this.requireSuperAdmin(actorId);
    const updated = await prisma.spending.updateMany({
      where: { id },
      data: {
        name: input.name,
        description: input.description || null,
        amount: new Prisma.Decimal(input.amount),
        paymentMethod: input.paymentMethod,
        spentAt: new Date(input.spentAt),
        updatedById: actorId,
      },
    });
    if (updated.count === 0) throw new SpendingNotFoundError();
    return prisma.spending.findUniqueOrThrow({
      where: { id },
      include: SPENDING_INCLUDE,
    });
  }
}
