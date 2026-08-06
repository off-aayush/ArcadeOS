import { NextRequest, NextResponse } from "next/server";
import { StationService } from "@/features/stations/services/station.service";
import { stationQuerySchema } from "@/features/stations/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      status: searchParams.get("status") || "ALL",
      type: searchParams.get("type") || "ALL",
      search: searchParams.get("search") || undefined,
    };

    const parsed = stationQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse("Invalid query parameters", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const stations = await StationService.getAll(parsed.data);
    return NextResponse.json(createSuccessResponse(stations));
  } catch (error: any) {
    console.error("API Error in GET /api/stations:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}
