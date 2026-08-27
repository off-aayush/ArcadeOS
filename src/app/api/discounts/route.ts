import { NextRequest, NextResponse } from "next/server";
import { DiscountService } from "@/features/billing/services/discount.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { z } from "zod";

const createDiscountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().max(20).optional().nullable(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().positive("Value must be greater than 0"),
  maxAmount: z.coerce.number().positive().optional().nullable(),
  minBillAmount: z.coerce.number().positive().optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check if this is from the billing flow (no permission required) or settings (needs MANAGE_DISCOUNTS)
    const settingsMode = request.nextUrl.searchParams.get("all") === "true";

    if (settingsMode) {
      const auth = await requirePermission(request, Permission.MANAGE_DISCOUNTS);
      if (auth instanceof NextResponse) return auth;
      const discounts = await DiscountService.getAll();
      return NextResponse.json(createSuccessResponse(discounts));
    }

    const discounts = await DiscountService.getActiveDiscounts();
    return NextResponse.json(createSuccessResponse(discounts));
  } catch (error: any) {
    console.error("GET /api/discounts error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, Permission.MANAGE_DISCOUNTS);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = createDiscountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const discount = await DiscountService.create(parsed.data);
    return NextResponse.json(createSuccessResponse(discount, "Discount created successfully"), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/discounts error:", error);
    if (error.message === "CODE_TAKEN") {
      return NextResponse.json(createErrorResponse("A discount with this code already exists", "CODE_TAKEN"), { status: 409 });
    }
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

