import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { addOrderItemSchema } from "@/features/billing/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bill = await BillingService.getEditableBillForSession(id);
    return NextResponse.json(createSuccessResponse(bill));
  } catch (error: any) {
    console.error("API Error in GET /api/sessions/[id]/orders:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = addOrderItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(parsed.error.issues[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }
    const bill = await BillingService.addOrderItem(id, parsed.data.foodItemId, parsed.data.quantity);
    return NextResponse.json(createSuccessResponse(bill, "Item added to order"), { status: 201 });
  } catch (error: any) {
    console.error("API Error in POST /api/sessions/[id]/orders:", error);
    const isClientError = error.message?.includes("not found") || error.message?.includes("Insufficient stock") || error.message?.includes("unavailable") || error.message?.includes("ACTIVE or PAUSED") || error.message?.includes("finalized");
    return NextResponse.json(createErrorResponse(error.message || "Internal server error"), { status: isClientError ? 400 : 500 });
  }
}