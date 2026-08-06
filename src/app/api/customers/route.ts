import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/features/customers/services/customer.service";
import { customerQuerySchema, customerCreateSchema } from "@/features/customers/validators";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "active",
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
    };

    const parsed = customerQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse("Invalid query parameters", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const result = await CustomerService.getAll(parsed.data);
    return NextResponse.json(createSuccessResponse(result));
  } catch (error: any) {
    console.error("API Error in GET /api/customers:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = customerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse((parsed.error as any).errors[0]?.message || "Invalid request body", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const { dateOfBirth, ...rest } = parsed.data;
    const customer = await CustomerService.create({
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    });

    return NextResponse.json(createSuccessResponse(customer, "Customer created successfully"), { status: 201 });
  } catch (error: any) {
    console.error("API Error in POST /api/customers:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        createErrorResponse("A customer with this phone or email already exists", "DUPLICATE"),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}
