import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/features/sessions/services/session.service";
import { sessionActionSchema } from "@/features/sessions/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await SessionService.getById(id);
    if (!session) {
      return NextResponse.json(createErrorResponse("Session not found", "NOT_FOUND"), { status: 404 });
    }
    return NextResponse.json(createSuccessResponse(session));
  } catch (error: any) {
    console.error("API Error in GET /api/sessions/[id]:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = sessionActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid action", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    let session;
    const { action } = parsed.data;

    if (action === "pause") {
      session = await SessionService.pause(id);
    } else if (action === "resume") {
      session = await SessionService.resume(id);
    } else if (action === "stop") {
      session = await SessionService.stop(id);
    }

    return NextResponse.json(createSuccessResponse(session, `Session ${action}d successfully`));
  } catch (error: any) {
    console.error("API Error in PATCH /api/sessions/[id]:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: error.message?.includes("not found") ? 404 : 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await SessionService.cancel(id);
    return NextResponse.json(createSuccessResponse(session, "Session cancelled"));
  } catch (error: any) {
    console.error("API Error in DELETE /api/sessions/[id]:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: error.message?.includes("not found") ? 404 : 400 }
    );
  }
}
