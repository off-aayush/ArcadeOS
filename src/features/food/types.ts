import { FoodItem, FoodCategory } from "@prisma/client";

export interface FoodQueryParams {
  search?: string;
  category?: FoodCategory | "ALL";
  inStock?: "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  page?: number;
  pageSize?: number;
}

export type FoodListItem = Pick<FoodItem, "id" | "name" | "category" | "price" | "isAvailable" | "stock" | "minStock">;
export type FoodDetail = FoodItem;
