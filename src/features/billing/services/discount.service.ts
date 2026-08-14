import { prisma } from "@/lib/prisma";
import { Discount } from "@prisma/client";

export class DiscountService {
  /**
   * Return all active, non-expired discount templates.
   */
  static async getActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { name: "asc" },
    });
  }
}
