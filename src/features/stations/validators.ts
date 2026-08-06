import { z } from "zod";
import { StationStatus, StationType } from "@prisma/client";

export const stationQuerySchema = z.object({
  status: z.nativeEnum(StationStatus).or(z.literal("ALL")).default("ALL"),
  type: z.nativeEnum(StationType).or(z.literal("ALL")).default("ALL"),
  search: z.string().optional(),
});
