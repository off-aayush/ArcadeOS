import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/features/customers/services/customer.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = await CustomerService.getVisitHistory(id);
    if (!history) {
      return NextResponse.json(createErrorResponse("Customer not found", "NOT_FOUND"), { status: 404 });
    }
    return NextResponse.json(createSuccessResponse(history));
  } catch (error) {
    console.error("API Error in GET /api/customers/[id]/visits:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
