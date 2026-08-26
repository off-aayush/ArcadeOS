// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — Next.js Edge Middleware
// Protects all /(dashboard) routes. Redirects unauthenticated users to /login.
// Also forwards X-User-Id header to API routes so they can identify the actor.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest, SESSION_COOKIE_NAME } from "@/lib/auth";

// Routes that should NEVER be protected (public)
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without any auth check
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow all other /api routes to handle their own auth for now,
  // EXCEPT those explicitly under /api/auth which are all public
  // Dashboard (UI) routes → enforce authentication
  const isDashboardRoute =
    !pathname.startsWith("/api/") && pathname !== "/";

  if (isDashboardRoute) {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      // Redirect to /login, preserving the intended destination
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Forward user identity to page/layout server components via headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-role", user.role.name);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
