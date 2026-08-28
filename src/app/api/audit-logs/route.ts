import { NextRequest, NextResponse } from "next/server";
import { AuditLogService } from "@/features/audit-logs/services/audit.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission, AuditAction } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
  action: z.string().optional().default("ALL"),
  userId: z.string().optional().default("ALL"),
  entityType: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, Permission.VIEW_AUDIT_LOGS);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);
    
    if (!parsed.success) {
      return NextResponse.json(createErrorResponse("Invalid query parameters"), { status: 400 });
    }

    const { page, pageSize, action, userId, entityType } = parsed.data;
    
    const logs = await AuditLogService.getLogs({
      page,
      pageSize,
      action: action as any,
      userId,
      entityType,
    });

    return NextResponse.json(createSuccessResponse(logs));
  } catch (error: any) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
