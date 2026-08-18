import { Customer, Session, Membership, MembershipTier, Gender } from "@prisma/client";

export type CustomerListItem = Customer & {
  membership: Membership | null;
  sessions: { id: string; station: { name: string } }[];
  _count: {
    sessions: number;
  };
};

export type CustomerDetail = Customer & {
  membership: Membership | null;
  sessions: (Session & {
    bill: { grandTotal: number } | null;
  })[];
};

export type CustomerStatusFilter = "active" | "inactive" | "all";

export interface CustomerQueryParams {
  search?: string;
  status?: CustomerStatusFilter;
  page?: number;
  pageSize?: number;
}

export { Gender, MembershipTier };
