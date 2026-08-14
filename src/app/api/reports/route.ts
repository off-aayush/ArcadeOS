import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/features/reports/services/report.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await ReportService.getDashboardReport({ startDate, endDate });

    return NextResponse.json(createSuccessResponse(data));
  } catch (error: any) {
    console.error("API Error in GET /api/reports:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Failed to fetch reports"),
      { status: 500 }
    );
  }
}
