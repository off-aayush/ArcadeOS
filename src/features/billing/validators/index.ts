import { z } from "zod";

// ── Generate a bill from a completed session ──────────────────────────────────
export const generateBillSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

// ── Query params for listing bills ────────────────────────────────────────────
export const billQuerySchema = z.object({
  status: z
    .enum(["ALL", "DRAFT", "PENDING", "PAID", "PARTIALLY_PAID", "VOIDED"])
    .optional()
    .default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type GenerateBillInput = z.infer<typeof generateBillSchema>;
export type BillQueryInput = z.infer<typeof billQuerySchema>;

// ── Record a payment against a bill ──────────────────────────────────────────
export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "UPI", "CARD", "WALLET", "COMPLIMENTARY"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ── Apply a discount to a bill ───────────────────────────────────────────────
export const applyDiscountSchema = z.object({
  discountId: z.string().optional(),
  customAmount: z.coerce.number().positive("Custom amount must be greater than 0").optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.discountId || data.customAmount,
  { message: "Either discountId or customAmount must be provided" }
);

export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;

// ── Add a manual adjustment to a bill ────────────────────────────────────────
export const addAdjustmentSchema = z.object({
  type: z.enum(["MANUAL_CREDIT", "MANUAL_CHARGE"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
});

export type AddAdjustmentInput = z.infer<typeof addAdjustmentSchema>;
