import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;

    const updatedBill = await BillingService.removeBillItem(id, itemId);

    return NextResponse.json(
      createSuccessResponse(updatedBill, "Item removed successfully"),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error in DELETE /api/bills/[id]/items/[itemId]:", error);
    const isClientError =
      error.message?.includes("not found") ||
      error.message?.includes("Cannot modify") ||
      error.message?.includes("Can only manually remove");
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: isClientError ? 400 : 500 }
    );
  }
}
