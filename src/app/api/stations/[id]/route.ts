import { NextRequest, NextResponse } from "next/server";
import { StationService } from "@/features/stations/services/station.service";
import { stationUpdateSchema } from "@/features/stations/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const station = await StationService.getById(id);

    if (!station) {
      return NextResponse.json(
        createErrorResponse("Station not found", "NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(station));
  } catch (error: any) {
    console.error(`API Error in GET /api/stations/[id]:`, error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = stationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(parsed.error.errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const station = await StationService.update(id, parsed.data);
    return NextResponse.json(createSuccessResponse(station, "Station updated successfully"));
  } catch (error: any) {
    console.error(`API Error in PATCH /api/stations/[id]:`, error);
    if (error.message === "Station not found") {
      return NextResponse.json(
        createErrorResponse(error.message, "NOT_FOUND"),
        { status: 404 }
      );
    }
    if (error.message.includes("active session")) {
      return NextResponse.json(
        createErrorResponse(error.message, "ACTIVE_SESSION_PROTECTION"),
        { status: 400 }
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        createErrorResponse("A station with this name already exists", "DUPLICATE_NAME"),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const station = await StationService.delete(id);
    return NextResponse.json(createSuccessResponse(station, "Station deleted successfully"));
  } catch (error: any) {
    console.error(`API Error in DELETE /api/stations/[id]:`, error);
    if (error.message === "Station not found") {
      return NextResponse.json(
        createErrorResponse(error.message, "NOT_FOUND"),
        { status: 404 }
      );
    }
    if (error.message.includes("active session")) {
      return NextResponse.json(
        createErrorResponse(error.message, "ACTIVE_SESSION_PROTECTION"),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}
