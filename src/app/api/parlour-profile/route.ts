import { NextRequest, NextResponse } from "next/server";
import { ParlourProfileService } from "@/features/parlour-profile/services/parlour-profile.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  tagline: z.string().max(200).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(20).optional().nullable(),
  gstin: z.string().max(15).optional().nullable(),
  receiptFooter: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url("Invalid URL").optional().nullable(),
  currencySymbol: z.string().max(5).optional(),
  timezone: z.string().max(50).optional(),
});

export async function GET(request: NextRequest) {
  // Profile is readable by any authenticated user (used in billing receipts)
  try {
    const profile = await ParlourProfileService.get();
    return NextResponse.json(createSuccessResponse(profile));
  } catch (error: any) {
    console.error("GET /api/parlour-profile error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, Permission.MANAGE_PARLOUR_PROFILE);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const profile = await ParlourProfileService.update(parsed.data);
    return NextResponse.json(createSuccessResponse(profile, "Parlour profile updated successfully"));
  } catch (error: any) {
    console.error("PATCH /api/parlour-profile error:", error);
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
