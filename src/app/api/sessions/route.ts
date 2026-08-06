import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/features/sessions/services/session.service";
import { startSessionSchema, sessionQuerySchema } from "@/features/sessions/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      status: searchParams.get("status") || "ALL",
      stationId: searchParams.get("stationId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
    };

    const parsed = sessionQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse("Invalid query parameters", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const result = await SessionService.getAll(parsed.data);
    return NextResponse.json(createSuccessResponse(result));
  } catch (error: any) {
    console.error("API Error in GET /api/sessions:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = startSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const session = await SessionService.start(parsed.data);
    return NextResponse.json(createSuccessResponse(session, "Session started successfully"), { status: 201 });
  } catch (error: any) {
    console.error("API Error in POST /api/sessions:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: error.message?.includes("not found") ? 404 : 400 }
    );
  }
}
