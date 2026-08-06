import { Session, Station, Customer, User, PricingModel, Bill } from "@prisma/client";

// A session with all relevant context for display and billing
export type SessionWithContext = Session & {
  station: Pick<Station, "id" | "name" | "type">;
  customer: Pick<Customer, "id" | "name" | "phone"> | null;
  startedBy: Pick<User, "id" | "name">;
  stoppedBy: Pick<User, "id" | "name"> | null;
  bill: Pick<Bill, "id" | "status" | "grandTotal"> | null;
};

// What we show in the sessions list page
export type SessionListItem = SessionWithContext;

// Payload for starting a session
export interface StartSessionInput {
  stationId: string;
  customerId?: string | null;
  playerCount?: number;
  notes?: string | null;
}

// Payload for actions on an in-progress session
export interface SessionActionInput {
  action: "pause" | "resume" | "stop";
}

export interface SessionQueryParams {
  status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ALL";
  stationId?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
}
