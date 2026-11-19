import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import type { SessionUser } from "@/features/auth/types";
import { createErrorResponse } from "@/lib/utils";

export async function requireSpendingAccess(request: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json(createErrorResponse("Not authenticated"), { status: 401 });
  }
  if (user.role?.name !== "SUPER_ADMIN") {
    return NextResponse.json(createErrorResponse("Super Admin access required", "FORBIDDEN"), { status: 403 });
  }
  return user;
}
