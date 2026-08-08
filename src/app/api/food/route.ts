import { NextRequest, NextResponse } from "next/server";
import { FoodService } from "@/features/food/services/food.service";
import { foodItemSchema } from "@/features/food/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { FoodCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      search: searchParams.get("search") || undefined,
      category: (searchParams.get("category") as FoodCategory | "ALL") || "ALL",
      inStock: (searchParams.get("inStock") as any) || "ALL",
      page: Number(searchParams.get("page") || 1),
      pageSize: Number(searchParams.get("pageSize") || 20),
    };

    const result = await FoodService.getAll(params);
    return NextResponse.json(createSuccessResponse(result));
  } catch (error: any) {
    console.error("API Error in GET /api/food:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = foodItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const item = await FoodService.create(parsed.data);
    return NextResponse.json(createSuccessResponse(item, "Product added successfully"), { status: 201 });
  } catch (error: any) {
    console.error("API Error in POST /api/food:", error);
    return NextResponse.json(
      createErrorResponse(error.message || "Internal server error"),
      { status: error.message?.includes("already exists") ? 409 : 400 }
    );
  }
}
