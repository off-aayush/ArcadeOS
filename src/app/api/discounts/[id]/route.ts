import { NextRequest, NextResponse } from "next/server";
import { DiscountService } from "@/features/billing/services/discount.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { z } from "zod";

const updateDiscountSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().max(20).optional().nullable(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  value: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional().nullable(),
  minBillAmount: z.coerce.number().positive().optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, Permission.MANAGE_DISCOUNTS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const discount = await DiscountService.getById(id);
    if (!discount) return NextResponse.json(createErrorResponse("Discount not found"), { status: 404 });
    return NextResponse.json(createSuccessResponse(discount));
  } catch (error: any) {
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, Permission.MANAGE_DISCOUNTS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateDiscountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const discount = await DiscountService.update(id, parsed.data);
    return NextResponse.json(createSuccessResponse(discount, "Discount updated successfully"));
  } catch (error: any) {
    console.error(`PATCH /api/discounts/${id} error:`, error);
    if (error.message === "NOT_FOUND") return NextResponse.json(createErrorResponse("Discount not found"), { status: 404 });
    if (error.message === "CODE_TAKEN") return NextResponse.json(createErrorResponse("A discount with this code already exists", "CODE_TAKEN"), { status: 409 });
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, Permission.MANAGE_DISCOUNTS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await DiscountService.delete(id);
    return NextResponse.json(createSuccessResponse(null, "Discount deleted successfully"));
  } catch (error: any) {
    console.error(`DELETE /api/discounts/${id} error:`, error);
    if (error.message === "NOT_FOUND") return NextResponse.json(createErrorResponse("Discount not found"), { status: 404 });
    if (error.message === "IN_USE") return NextResponse.json(createErrorResponse("Cannot delete a discount that has been applied to bills. Deactivate it instead.", "IN_USE"), { status: 409 });
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
