import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/features/users/services/user.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { createUserSchema } from "@/features/users/validators";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, Permission.MANAGE_USERS);
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await UserService.getAll();
    return NextResponse.json(createSuccessResponse(users));
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, Permission.MANAGE_USERS);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const user = await UserService.create(parsed.data);
    return NextResponse.json(createSuccessResponse(user, "User created successfully"), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    if (error.message === "EMAIL_TAKEN") {
      return NextResponse.json(createErrorResponse("A user with this email already exists", "EMAIL_TAKEN"), { status: 409 });
    }
    if (error.message === "ROLE_NOT_FOUND") {
      return NextResponse.json(createErrorResponse("Selected role not found", "ROLE_NOT_FOUND"), { status: 400 });
    }
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
