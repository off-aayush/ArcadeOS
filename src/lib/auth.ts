// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — Auth Core
// JWT signing/verification + cookie helpers using `jose` (Edge-compatible)
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SessionUser } from "@/features/auth/types";

export const SESSION_COOKIE_NAME = "arcadeos_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT containing the SessionUser payload.
 */
export async function signJwt(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...(payload as unknown as JWTPayload) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verify a JWT and return its payload, or null if invalid/expired.
 */
export async function verifyJwt(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Read and verify the session cookie from a NextRequest.
 * Used in middleware and API route handlers.
 */
export async function getAuthUserFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

/**
 * Read and verify the session cookie from the Next.js server-side cookies store.
 * Used in Server Components and API routes that use `next/headers`.
 */
export async function getAuthUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}
