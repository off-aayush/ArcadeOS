import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/features/billing/services/billing.service";
import { generateBillSchema, billQuerySchema } from "@/features/billing/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      status: searchParams.get("status") || "ALL",
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
    };

    const parsed = billQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse("Invalid query parameters", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const result = await BillingService.getAll(parsed.data);
    return NextResponse.json(createSuccessResponse(result));
  } catch (error: any) {
    console.error("API Error in GET /api/bills:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateBillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(
          parsed.error.issues[0]?.message || "Invalid request body",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    const bill = await BillingService.generateBill(parsed.data.sessionId);
    return NextResponse.json(
      createSuccessResponse(bill, "Invoice generated successfully"),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error in POST /api/bills:", error);
    const isClientError =
      error.message?.includes("not found") ||
      error.message?.includes("already exists") ||
      error.message?.includes("only") ||
      error.message?.includes("COMPLETED");
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: isClientError ? 400 : 500 }
    );
  }
}
