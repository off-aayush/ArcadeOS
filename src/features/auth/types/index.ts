// ─────────────────────────────────────────────────────────────────────────────
// Auth Feature — Types
// ─────────────────────────────────────────────────────────────────────────────

import type { UserRole } from "@prisma/client";

/**
 * The minimal user payload stored inside the JWT.
 * Kept small to reduce cookie size.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Input shape for the login form.
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Public user object returned by /api/auth/me.
 * Omits the password hash.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
}
