import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { z } from "zod";

const attachSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = attachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(parsed.error.issues[0].message, "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const updatedBill = await BillingService.attachCustomer(id, parsed.data.customerId);
    return NextResponse.json(createSuccessResponse(updatedBill));
  } catch (error: any) {
    console.error("API Error in PATCH /api/bills/[id]/attach-customer:", error);
    const status =
      error.message.includes("not found") ? 404 :
      error.message.includes("already attached") ? 409 :
      error.message.includes("voided") ? 422 : 500;
    return NextResponse.json(createErrorResponse(error.message), { status });
  }
}
