import type { Spending, User } from "@prisma/client";

export type SpendingRecord = Spending & {
  createdBy: Pick<User, "id" | "name">;
  updatedBy: Pick<User, "id" | "name">;
};

export type SpendingTrend = {
  groupBy: "day" | "week" | "month";
  points: { date: string; amount: number }[];
  total: string;
};
