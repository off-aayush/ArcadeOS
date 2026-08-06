import { z } from "zod";

export const startSessionSchema = z.object({
  stationId: z.string().min(1, "Station is required"),
  customerId: z.string().optional().nullable(),
  playerCount: z.number().int().min(1).max(100).default(1),
  notes: z.string().max(500).optional().nullable(),
});

export const sessionActionSchema = z.object({
  action: z.enum(["pause", "resume", "stop"]),
});

export const sessionQuerySchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED", "ALL"]).default("ALL"),
  stationId: z.string().optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
