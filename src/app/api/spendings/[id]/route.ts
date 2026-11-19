import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { requireSpendingAccess } from "@/features/spendings/auth";
import {
  SpendingForbiddenError,
  SpendingNotFoundError,
  SpendingService,
} from "@/features/spendings/services/spending.service";
import { spendingSchema } from "@/features/spendings/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await requireSpendingAccess(request);
  if (actor instanceof NextResponse) return actor;
  const parsed = spendingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(createErrorResponse(parsed.error.issues[0]?.message || "Invalid spending", "VALIDATION_ERROR"), { status: 400 });
  }
  try {
    const { id } = await params;
    return NextResponse.json(createSuccessResponse(
      await SpendingService.update(actor.id, id, parsed.data), "Spending updated",
    ));
  } catch (error) {
    if (error instanceof SpendingForbiddenError) {
      return NextResponse.json(createErrorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    if (error instanceof SpendingNotFoundError) {
      return NextResponse.json(createErrorResponse(error.message, "NOT_FOUND"), { status: 404 });
    }
    console.error("PATCH /api/spendings/[id] error:", error);
    return NextResponse.json(createErrorResponse("Failed to update spending"), { status: 500 });
  }
}
