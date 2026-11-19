import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value, "Use a valid date");

export const spendingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  description: z.string().trim().max(1000, "Description is too long").optional(),
  amount: z.string().trim()
    .regex(/^\d{1,10}(?:\.\d{1,2})?$/, "Enter a positive amount with up to two decimal places")
    .refine((value) => Number(value) > 0 && Number(value) <= 9999999999.99,
      "Amount must be greater than zero"),
  paymentMethod: z.enum(PaymentMethod, { error: "Select a payment method" }),
  spentAt: z.iso.datetime({ offset: true }),
});

export const spendingCreateSchema = spendingSchema.extend({
  requestKey: z.string().uuid("A unique request key is required"),
});

export const spendingRangeSchema = z.object({
  startDate: calendarDate,
  endDate: calendarDate,
}).refine((range) => range.startDate <= range.endDate, {
  path: ["endDate"],
  message: "End date must be on or after start date",
});

export const spendingListSchema = spendingRangeSchema.safeExtend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SpendingInput = z.infer<typeof spendingSchema>;
export type SpendingCreateInput = z.infer<typeof spendingCreateSchema>;
export type SpendingRange = z.infer<typeof spendingRangeSchema>;
export type SpendingListQuery = z.infer<typeof spendingListSchema>;
