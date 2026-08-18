import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { updateOrderItemSchema } from "@/features/billing/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const parsed = updateOrderItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(parsed.error.issues[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }
    const bill = await BillingService.updateOrderItem(itemId, parsed.data.quantity);
    return NextResponse.json(createSuccessResponse(bill, "Order item updated"));
  } catch (error: any) {
    console.error("API Error in PATCH /api/sessions/[id]/orders/[itemId]:", error);
    const isClientError = error.message?.includes("not found") || error.message?.includes("Insufficient stock") || error.message?.includes("Cannot modify");
    return NextResponse.json(createErrorResponse(error.message || "Internal server error"), { status: isClientError ? 400 : 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const bill = await BillingService.removeOrderItem(itemId);
    return NextResponse.json(createSuccessResponse(bill, "Order item removed"));
  } catch (error: any) {
    console.error("API Error in DELETE /api/sessions/[id]/orders/[itemId]:", error);
    const isClientError = error.message?.includes("not found") || error.message?.includes("Cannot modify");
    return NextResponse.json(createErrorResponse(error.message || "Internal server error"), { status: isClientError ? 400 : 500 });
  }
}