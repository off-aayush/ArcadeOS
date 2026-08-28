import { prisma } from "@/lib/prisma";
import { AuditLog, AuditAction } from "@prisma/client";

export interface GetAuditLogsParams {
  page?: number;
  pageSize?: number;
  action?: AuditAction | "ALL";
  userId?: string | "ALL";
  entityType?: string;
}

export class AuditLogService {
  /**
   * Retrieve paginated audit logs with optional filtering.
   */
  static async getLogs(params: GetAuditLogsParams) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.action && params.action !== "ALL") {
      where.action = params.action;
    }
    if (params.userId && params.userId !== "ALL") {
      where.userId = params.userId;
    }
    if (params.entityType) {
      where.entityType = params.entityType;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      metadata: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Record a new audit log (used internally by other services).
   */
  static async log(
    action: AuditAction,
    entityType: string,
    entityId: string,
    userId: string | null = null,
    metadata: any = null
  ) {
    return prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });
  }
}
