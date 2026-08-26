import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/features/users/services/user.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { changePasswordSchema } from "@/features/users/validators";

interface Params { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, Permission.MANAGE_USERS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    await UserService.changePassword(id, parsed.data.newPassword);
    return NextResponse.json(createSuccessResponse(null, "Password changed successfully"));
  } catch (error: any) {
    console.error(`POST /api/users/${id}/password error:`, error);
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(createErrorResponse("User not found"), { status: 404 });
    }
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
