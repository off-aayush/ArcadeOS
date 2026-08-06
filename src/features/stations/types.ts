import { Station, StationType, StationStatus, Session, Customer, User } from "@/types";

export type StationListItem = Station & {
  sessions: (Session & {
    customer: Customer | null;
    startedBy: Pick<User, "id" | "name">;
  })[];
};

export type StationStatusFilter = StationStatus | "ALL";

export interface StationQueryParams {
  status?: StationStatusFilter;
  type?: StationType | "ALL";
  search?: string;
}
