import { Station, StationType, StationStatus, Session, Customer, User } from "@/types";

export type StationListItem = Station & {
  sessions: (Session & {
    customer: Customer | null;
    startedBy: Pick<User, "id" | "name">;
    bill: {
      id: string;
      status: string;
      grandTotal: any; // Prisma Decimal, but 'any' is easiest since we don't strict type Decimal to FE everywhere
    } | null;
  })[];
};

export type StationStatusFilter = StationStatus | "ALL";

export interface StationQueryParams {
  status?: StationStatusFilter;
  type?: StationType | "ALL";
  search?: string;
}
