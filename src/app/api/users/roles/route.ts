import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/features/users/services/user.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, Permission.MANAGE_USERS);
  if (auth instanceof NextResponse) return auth;

  try {
    const roles = await UserService.getRoles();
    return NextResponse.json(createSuccessResponse(roles));
  } catch (error: any) {
    console.error("GET /api/users/roles error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
