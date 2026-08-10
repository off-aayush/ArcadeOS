import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { recordPaymentSchema } from "@/features/billing/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const parsed = recordPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(
          parsed.error.issues[0]?.message || "Invalid payment data",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    const updatedBill = await BillingService.recordPayment(id, parsed.data);
    
    return NextResponse.json(
      createSuccessResponse(updatedBill, "Payment recorded successfully"),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error in POST /api/bills/[id]/payments:", error);
    
    const isClientError = 
      error.message?.includes("not found") || 
      error.message?.includes("exceeds amount due") ||
      error.message?.includes("fully paid");
      
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: isClientError ? 400 : 500 }
    );
  }
}
