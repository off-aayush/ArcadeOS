import { NextRequest, NextResponse } from "next/server";
import { StationService } from "@/features/stations/services/station.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const stats = await StationService.getStats();
    return NextResponse.json(createSuccessResponse(stats));
  } catch (error: any) {
    console.error("API Error in GET /api/dashboard/stats:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}
