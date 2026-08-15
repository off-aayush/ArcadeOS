import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { AuthService } from "@/features/auth/services/auth.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getAuthUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json(createErrorResponse("Not authenticated"), { status: 401 });
    }

    // Rehydrate from DB to get latest role/active status
    const user = await AuthService.getById(sessionUser.id);
    if (!user) {
      return NextResponse.json(createErrorResponse("User not found or deactivated"), { status: 401 });
    }

    return NextResponse.json(createSuccessResponse(user));
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
