import { Bill, BillItem, BillStatus, FoodItem, Discount, Payment, Session, Station, Customer, User } from "@prisma/client";

// ── Bill with all relations for invoice view ──────────────────────────────────
export type BillItemWithRefs = BillItem & {
  foodItem: FoodItem | null;
  discount: Discount | null;
};

export type BillWithDetails = Bill & {
  items: BillItemWithRefs[];
  payments: Payment[];
  session: Session & {
    station: Pick<Station, "id" | "name" | "type">;
    customer: Pick<Customer, "id" | "name" | "phone"> | null;
  };
  issuedBy: Pick<User, "id" | "name">;
};

// ── Bill list item (paginated table row) ─────────────────────────────────────
export type BillListItem = Pick<Bill, "id" | "billNumber" | "status" | "grandTotal" | "amountPaid" | "amountDue" | "createdAt" | "paidAt"> & {
  session: {
    station: Pick<Station, "id" | "name">;
    customer: Pick<Customer, "id" | "name"> | null;
  };
};

// ── Input types ───────────────────────────────────────────────────────────────
export interface GenerateBillInput {
  sessionId: string;
}

export interface BillQueryParams {
  status?: BillStatus | "ALL";
  page?: number;
  pageSize?: number;
}
