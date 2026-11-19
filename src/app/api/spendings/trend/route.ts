import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { requireSpendingAccess } from "@/features/spendings/auth";
import { SpendingForbiddenError, SpendingService } from "@/features/spendings/services/spending.service";
import { spendingRangeSchema } from "@/features/spendings/validators";

export async function GET(request: NextRequest) {
  const actor = await requireSpendingAccess(request);
  if (actor instanceof NextResponse) return actor;
  const parsed = spendingRangeSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(createErrorResponse("Invalid date range", "VALIDATION_ERROR"), { status: 400 });
  }
  try {
    return NextResponse.json(createSuccessResponse(await SpendingService.trend(actor.id, parsed.data)));
  } catch (error) {
    if (error instanceof SpendingForbiddenError) {
      return NextResponse.json(createErrorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    console.error("GET /api/spendings/trend error:", error);
    return NextResponse.json(createErrorResponse("Failed to load spending trend"), { status: 500 });
  }
}
