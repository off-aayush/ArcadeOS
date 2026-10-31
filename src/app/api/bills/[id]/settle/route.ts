import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bill = await BillingService.settleZeroBill(id);
    return NextResponse.json(createSuccessResponse(bill, "Bill settled"));
  } catch (error: any) {
    const message = error.message || "Internal server error";
    const isClientError = message.includes("not found") || message.includes("Only") || message.includes("already settled");
    return NextResponse.json(createErrorResponse(message), { status: isClientError ? 400 : 500 });
  }
}
