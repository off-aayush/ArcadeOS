import type { SessionUser } from "@/features/auth/types";
import { Permission } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "./auth";

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(user: SessionUser | null, permission: Permission): boolean {
  if (!user || !user.role || !Array.isArray(user.role.permissions)) return false;
  return user.role.permissions.includes(permission);
}

/**
 * Check if a user has ANY of the specified permissions.
 */
export function hasAnyPermission(user: SessionUser | null, permissions: Permission[]): boolean {
  if (!user || !user.role || !Array.isArray(user.role.permissions)) return false;
  return permissions.some(p => user.role.permissions.includes(p));
}

/**
 * API Route guard. Returns the user if authorized, or a Next/Response Error if not.
 * Usage in Route Handlers:
 * 
 * const authResult = await requirePermission(request, Permission.MANAGE_STATIONS);
 * if (authResult instanceof NextResponse) return authResult;
 * const user = authResult;
 */
export async function requirePermission(request: NextRequest, permission: Permission): Promise<SessionUser | NextResponse> {
  const user = await getAuthUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!hasPermission(user, permission)) {
    return NextResponse.json({ success: false, error: "You don't have permission to perform this action" }, { status: 403 });
  }

  return user;
}
