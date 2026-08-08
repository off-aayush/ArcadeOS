import { z } from "zod";
import { FoodCategory } from "@prisma/client";

export const foodItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category: z.nativeEnum(FoodCategory),
  price: z.coerce.number().min(0, "Price must be positive"),
  description: z.string().max(250).optional().nullable(),
  isAvailable: z.boolean().default(true),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
});

export const updateFoodItemSchema = foodItemSchema.partial();

export const stockAdjustmentSchema = z.object({
  amount: z.coerce.number().int().refine(val => val !== 0, "Amount cannot be zero"),
  reason: z.string().min(3, "Please provide a reason for manual adjustment").max(100).optional(),
});
