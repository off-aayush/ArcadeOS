// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — Next.js Edge Middleware
// Protects all /(dashboard) and /api routes. Redirects unauthenticated users.
// Applies global RBAC permission gating for both UI and API.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";

// Routes that should NEVER be protected (public)
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

// Global API permission mapping
const API_PERMISSIONS: Record<string, string> = {
  "/api/stations": "MANAGE_STATIONS",
  "/api/sessions": "MANAGE_SESSIONS",
  "/api/customers": "MANAGE_CUSTOMERS",
  "/api/bills": "MANAGE_BILLING",
  "/api/food": "MANAGE_INVENTORY",
  "/api/reports": "VIEW_REPORTS",
  "/api/dashboard": "VIEW_DASHBOARD",
  "/api/users": "MANAGE_USERS",
  "/api/discounts": "MANAGE_DISCOUNTS",
  "/api/audit-logs": "VIEW_AUDIT_LOGS",
  // Note: /api/auth/me and /api/parlour-profile are allowed for all authenticated users
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/") {
    return NextResponse.next();
  }

  // 2. Authenticate user
  const user = await getAuthUserFromRequest(request);
  const isApiRoute = pathname.startsWith("/api/");

  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    } else {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const permissions = user.role.permissions || [];

  // 3. API Route Permission Checks
  if (isApiRoute) {
    let requiredPermission: string | null = null;
    for (const [prefix, perm] of Object.entries(API_PERMISSIONS)) {
      if (pathname.startsWith(prefix)) {
        requiredPermission = perm;
        break;
      }
    }

    if (requiredPermission && !permissions.includes(requiredPermission as any)) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to perform this action" },
        { status: 403 }
      );
    }
  }

  // 4. UI Route Permission Checks
  if (pathname.startsWith("/settings/")) {
    let authorized = true;
    if (pathname.startsWith("/settings/users") && !permissions.includes("MANAGE_USERS" as any)) authorized = false;
    else if (pathname.startsWith("/settings/discounts") && !permissions.includes("MANAGE_DISCOUNTS" as any)) authorized = false;
    else if (pathname.startsWith("/settings/audit-logs") && !permissions.includes("VIEW_AUDIT_LOGS" as any)) authorized = false;
    else if (pathname.startsWith("/settings/profile") && !permissions.includes("MANAGE_PARLOUR_PROFILE" as any)) authorized = false;

    if (!authorized) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 5. Forward Headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-role", user.role.name);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
