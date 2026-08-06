import { z } from "zod";
import { Gender } from "@prisma/client";

export const customerCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  phone: z.string().min(10, "Enter a valid phone number").max(15).optional().nullable(),
  email: z.string().email("Enter a valid email").optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(), // ISO date string from input[type=date]
  notes: z.string().max(500).optional().nullable(),
});

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "all"]).default("active"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
