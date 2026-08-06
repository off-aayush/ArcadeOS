import { z } from "zod";
import { StationStatus, StationType, PricingModel } from "@prisma/client";

export const stationQuerySchema = z.object({
  status: z.nativeEnum(StationStatus).or(z.literal("ALL")).default("ALL"),
  type: z.nativeEnum(StationType).or(z.literal("ALL")).default("ALL"),
  search: z.string().optional(),
});

export const stationCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.nativeEnum(StationType),
  pricingModel: z.nativeEnum(PricingModel).default(PricingModel.PER_HOUR),
  ratePerHour: z.number().min(0, "Rate per hour must be 0 or greater"),
  ratePerMinute: z.number().min(0, "Rate per minute must be 0 or greater").optional().nullable(),
  maxPlayers: z.number().int().min(1, "Maximum players must be at least 1").max(100),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").or(z.literal("")).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
});

export const stationUpdateSchema = stationCreateSchema.partial().extend({
  status: z.nativeEnum(StationStatus).optional(),
  isActive: z.boolean().optional(),
});
