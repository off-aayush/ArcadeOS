import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { addAdjustmentSchema } from "@/features/billing/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = addAdjustmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(
          parsed.error.issues[0]?.message || "Invalid adjustment data",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    const updatedBill = await BillingService.addAdjustment(id, parsed.data);

    return NextResponse.json(
      createSuccessResponse(updatedBill, "Adjustment added successfully"),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error in POST /api/bills/[id]/adjustments:", error);
    const isClientError =
      error.message?.includes("not found") ||
      error.message?.includes("Cannot modify");
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: isClientError ? 400 : 500 }
    );
  }
}
