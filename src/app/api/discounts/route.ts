import { NextResponse } from "next/server";
import { DiscountService } from "@/features/billing/services/discount.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET() {
  try {
    const discounts = await DiscountService.getActiveDiscounts();
    return NextResponse.json(createSuccessResponse(discounts));
  } catch (error: any) {
    console.error("API Error in GET /api/discounts:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
