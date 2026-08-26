import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/features/users/services/user.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { updateUserSchema, changePasswordSchema } from "@/features/users/validators";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, Permission.MANAGE_USERS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const user = await UserService.getById(id);
    if (!user) {
      return NextResponse.json(createErrorResponse("User not found"), { status: 404 });
    }
    return NextResponse.json(createSuccessResponse(user));
  } catch (error: any) {
    console.error(`GET /api/users/${id} error:`, error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, Permission.MANAGE_USERS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const user = await UserService.update(id, parsed.data);
    return NextResponse.json(createSuccessResponse(user, "User updated successfully"));
  } catch (error: any) {
    console.error(`PATCH /api/users/${id} error:`, error);
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(createErrorResponse("User not found"), { status: 404 });
    }
    if (error.message === "LAST_SUPER_ADMIN") {
      return NextResponse.json(
        createErrorResponse("Cannot deactivate or change the role of the last Super Admin", "LAST_SUPER_ADMIN"),
        { status: 409 }
      );
    }
    if (error.message === "ROLE_NOT_FOUND") {
      return NextResponse.json(createErrorResponse("Selected role not found"), { status: 400 });
    }
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, Permission.MANAGE_USERS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  // Prevent self-deletion
  if (auth.id === id) {
    return NextResponse.json(createErrorResponse("You cannot delete your own account"), { status: 409 });
  }

  try {
    await UserService.delete(id);
    return NextResponse.json(createSuccessResponse(null, "User deleted successfully"));
  } catch (error: any) {
    console.error(`DELETE /api/users/${id} error:`, error);
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(createErrorResponse("User not found"), { status: 404 });
    }
    if (error.message === "LAST_SUPER_ADMIN") {
      return NextResponse.json(
        createErrorResponse("Cannot delete the last Super Admin", "LAST_SUPER_ADMIN"),
        { status: 409 }
      );
    }
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
