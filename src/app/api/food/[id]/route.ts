import { NextRequest, NextResponse } from "next/server";
import { FoodService } from "@/features/food/services/food.service";
import { updateFoodItemSchema, stockAdjustmentSchema } from "@/features/food/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await FoodService.getById(id);
    if (!item) {
      return NextResponse.json(createErrorResponse("Product not found", "NOT_FOUND"), { status: 404 });
    }
    return NextResponse.json(createSuccessResponse(item));
  } catch (error: any) {
    console.error("API Error in GET /api/food/[id]:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if this is a stock adjustment or a standard update
    if (body.action === "adjustStock") {
      const parsed = stockAdjustmentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid adjustment", "VALIDATION_ERROR"),
          { status: 400 }
        );
      }
      const item = await FoodService.adjustStock(id, parsed.data.amount);
      return NextResponse.json(createSuccessResponse(item, "Stock adjusted successfully"));
    }

    // Otherwise, it's a standard update
    const parsed = updateFoodItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const item = await FoodService.update(id, parsed.data);
    return NextResponse.json(createSuccessResponse(item, "Product updated successfully"));
  } catch (error: any) {
    console.error("API Error in PATCH /api/food/[id]:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: error.message?.includes("not found") ? 404 : 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await FoodService.delete(id);
    return NextResponse.json(createSuccessResponse(null, "Product deleted successfully"));
  } catch (error: any) {
    console.error("API Error in DELETE /api/food/[id]:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: error.message?.includes("not found") ? 404 : 400 }
    );
  }
}
