import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bill = await BillingService.getById(id);
    if (!bill) {
      return NextResponse.json(
        createErrorResponse("Bill not found", "NOT_FOUND"),
        { status: 404 }
      );
    }
    return NextResponse.json(createSuccessResponse(bill));
  } catch (error: any) {
    console.error("API Error in GET /api/bills/[id]:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
