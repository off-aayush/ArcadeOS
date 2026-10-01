import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { z } from "zod";

const attachCustomerSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = attachCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(parsed.error.issues[0]?.message || "Invalid body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const bill = await BillingService.attachCustomer(id, parsed.data.customerId);
    
    return NextResponse.json(createSuccessResponse(bill, "Customer attached successfully"));
  } catch (error: any) {
    console.error("API Error in PATCH /api/bills/[id]/attach-customer:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: error.message?.includes("not found") ? 404 : 400 }
    );
  }
}
