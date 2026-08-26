// ─────────────────────────────────────────────────────────────────────────────
// Auth Feature — Types
// ─────────────────────────────────────────────────────────────────────────────

import type { Permission } from "@prisma/client";

/**
 * The minimal user payload stored inside the JWT.
 * Kept small to reduce cookie size.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    permissions: Permission[];
  };
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
  role: {
    id: string;
    name: string;
    permissions: Permission[];
  };
  avatarUrl: string | null;
}
