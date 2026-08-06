import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/features/customers/services/customer.service";
import { customerUpdateSchema } from "@/features/customers/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await CustomerService.getById(id);
    if (!customer) {
      return NextResponse.json(createErrorResponse("Customer not found", "NOT_FOUND"), { status: 404 });
    }
    return NextResponse.json(createSuccessResponse(customer));
  } catch (error: any) {
    console.error("API Error in GET /api/customers/[id]:", error);
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
    const parsed = customerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const { dateOfBirth, ...rest } = parsed.data;
    const customer = await CustomerService.update(id, {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    });

    return NextResponse.json(createSuccessResponse(customer, "Customer updated successfully"));
  } catch (error: any) {
    console.error("API Error in PATCH /api/customers/[id]:", error);
    if (error.message === "Customer not found") {
      return NextResponse.json(createErrorResponse(error.message, "NOT_FOUND"), { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        createErrorResponse("Phone or email already taken by another customer", "DUPLICATE"),
        { status: 400 }
      );
    }
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await CustomerService.delete(id);
    return NextResponse.json(createSuccessResponse(null, "Customer deleted successfully"));
  } catch (error: any) {
    console.error("API Error in DELETE /api/customers/[id]:", error);
    if (error.message === "Customer not found") {
      return NextResponse.json(createErrorResponse(error.message, "NOT_FOUND"), { status: 404 });
    }
    if (error.message.includes("active session")) {
      return NextResponse.json(
        createErrorResponse(error.message, "ACTIVE_SESSION_PROTECTION"),
        { status: 400 }
      );
    }
    return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 });
  }
}
