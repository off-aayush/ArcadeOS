import { FoodCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { FoodService } from "@/features/food/services/food.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { requireInventoryTransactionPermission } from "@/lib/permissions";

/** Read-only catalogue for validated session and billing inventory transactions. */
export async function GET(request: NextRequest) {
  const user = await requireInventoryTransactionPermission(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const result = await FoodService.getAll({
      search: searchParams.get("search") || undefined,
      category: (searchParams.get("category") as FoodCategory | "ALL") || "ALL",
      inStock: "IN_STOCK",
      page: Math.max(1, Number(searchParams.get("page") || 1)),
      pageSize: Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 100))),
      availableOnly: true,
    });
    return NextResponse.json(createSuccessResponse(result));
  } catch (error) {
    console.error("API Error in GET /api/food/available:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
