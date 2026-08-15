import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/features/auth/services/auth.service";
import { loginSchema } from "@/features/auth/validators";
import { signJwt, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(parsed.error.issues[0].message),
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Authenticate
    const user = await AuthService.login(email, password);
    const sessionUser = AuthService.toSessionUser(user);
    const token = await signJwt(sessionUser);

    // Set HTTP-only session cookie
    const response = NextResponse.json(createSuccessResponse(user));
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error.message);
    return NextResponse.json(
      createErrorResponse(error.message || "Authentication failed"),
      { status: 401 }
    );
  }
}
