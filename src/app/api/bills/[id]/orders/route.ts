import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { addStandaloneOrderItemSchema } from "@/features/billing/validators";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = addStandaloneOrderItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(createErrorResponse(parsed.error.issues[0]?.message || "Invalid item"), { status: 400 });
    }
    const bill = await BillingService.addStandaloneItem(id, parsed.data.foodItemId, parsed.data.quantity, parsed.data.idempotencyKey);
    return NextResponse.json(createSuccessResponse(bill, "Item added"), { status: 201 });
  } catch (error: any) {
    const message = error.message || "Internal server error";
    const isClientError = /not found|unavailable|Insufficient stock|Only unpaid|Quantity|Request key|request key/.test(message);
    return NextResponse.json(createErrorResponse(message), { status: isClientError ? 400 : 500 });
  }
}
