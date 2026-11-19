import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { requireSpendingAccess } from "@/features/spendings/auth";
import { SpendingConflictError, SpendingForbiddenError, SpendingService } from "@/features/spendings/services/spending.service";
import { spendingCreateSchema, spendingListSchema } from "@/features/spendings/validators";

export async function GET(request: NextRequest) {
  const actor = await requireSpendingAccess(request);
  if (actor instanceof NextResponse) return actor;
  const parsed = spendingListSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(createErrorResponse("Invalid date range or pagination", "VALIDATION_ERROR"), { status: 400 });
  }
  try {
    return NextResponse.json(createSuccessResponse(await SpendingService.list(actor.id, parsed.data)));
  } catch (error) {
    if (error instanceof SpendingForbiddenError) {
      return NextResponse.json(createErrorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    console.error("GET /api/spendings error:", error);
    return NextResponse.json(createErrorResponse("Failed to load spendings"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const actor = await requireSpendingAccess(request);
  if (actor instanceof NextResponse) return actor;
  const parsed = spendingCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(createErrorResponse(parsed.error.issues[0]?.message || "Invalid spending", "VALIDATION_ERROR"), { status: 400 });
  }
  try {
    const record = await SpendingService.create(actor.id, parsed.data);
    return NextResponse.json(createSuccessResponse(record, "Spending recorded"), { status: 201 });
  } catch (error) {
    if (error instanceof SpendingConflictError) {
      return NextResponse.json(createErrorResponse(error.message, "CONFLICT"), { status: 409 });
    }
    if (error instanceof SpendingForbiddenError) {
      return NextResponse.json(createErrorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    console.error("POST /api/spendings error:", error);
    return NextResponse.json(createErrorResponse("Failed to record spending"), { status: 500 });
  }
}
