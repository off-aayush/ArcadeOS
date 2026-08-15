import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { createSuccessResponse } from "@/lib/utils";

export async function POST() {
  const response = NextResponse.json(createSuccessResponse({ loggedOut: true }));
  // Clear the session cookie by setting maxAge to 0
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
