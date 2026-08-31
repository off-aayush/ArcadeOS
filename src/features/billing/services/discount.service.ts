import { prisma } from "@/lib/prisma";
import { Discount, DiscountType, Prisma } from "@prisma/client";
import { AuditLogService } from "@/features/audit-logs/services/audit.service";
import { getAuthUser } from "@/lib/auth";

async function getSystemUserId(): Promise<string> {
  try {
    const authUser = await getAuthUser();
    if (authUser) return authUser.id;
  } catch {
    // Ignore context errors
  }
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("No system user found. Please run the seed.");
  return user.id;
}

export interface CreateDiscountInput {
  name: string;
  code?: string | null;
  type: DiscountType;
  value: number;
  maxAmount?: number | null;
  minBillAmount?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
}

export interface UpdateDiscountInput extends Partial<CreateDiscountInput> {}

export class DiscountService {
  /**
   * Return all active, non-expired discount templates (used by billing flow).
   */
  static async getActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gte: now } }] }],
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Return ALL discounts (active + inactive) for the Settings management view.
   */
  static async getAll(): Promise<Discount[]> {
    return prisma.discount.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  }

  /**
   * Get a single discount by ID.
   */
  static async getById(id: string): Promise<Discount | null> {
    return prisma.discount.findUnique({ where: { id } });
  }

  /**
   * Create a new discount template.
   */
  static async create(input: CreateDiscountInput): Promise<Discount> {
    if (input.code) {
      const existing = await prisma.discount.findUnique({ where: { code: input.code } });
      if (existing) throw new Error("CODE_TAKEN");
    }

    const discount = await prisma.discount.create({
      data: {
        name: input.name.trim(),
        code: input.code?.trim().toUpperCase() || null,
        type: input.type,
        value: new Prisma.Decimal(input.value),
        maxAmount: input.maxAmount != null ? new Prisma.Decimal(input.maxAmount) : null,
        minBillAmount: input.minBillAmount != null ? new Prisma.Decimal(input.minBillAmount) : null,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        isActive: input.isActive ?? true,
      },
    });

    const actorId = await getSystemUserId();
    await AuditLogService.log("CREATE", "Discount", discount.id, actorId, { name: discount.name, type: discount.type });
    return discount;
  }

  /**
   * Update a discount template.
   */
  static async update(id: string, input: UpdateDiscountInput): Promise<Discount> {
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");

    if (input.code && input.code !== existing.code) {
      const codeConflict = await prisma.discount.findFirst({
        where: { code: input.code.trim().toUpperCase(), id: { not: id } },
      });
      if (codeConflict) throw new Error("CODE_TAKEN");
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) data.code = input.code?.trim().toUpperCase() || null;
    if (input.type !== undefined) data.type = input.type;
    if (input.value !== undefined) data.value = new Prisma.Decimal(input.value);
    if (input.maxAmount !== undefined) data.maxAmount = input.maxAmount != null ? new Prisma.Decimal(input.maxAmount) : null;
    if (input.minBillAmount !== undefined) data.minBillAmount = input.minBillAmount != null ? new Prisma.Decimal(input.minBillAmount) : null;
    if (input.validFrom !== undefined) data.validFrom = input.validFrom ? new Date(input.validFrom) : null;
    if (input.validUntil !== undefined) data.validUntil = input.validUntil ? new Date(input.validUntil) : null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await prisma.discount.update({ where: { id }, data });

    const actorId = await getSystemUserId();
    await AuditLogService.log("UPDATE", "Discount", id, actorId, { name: updated.name, fieldsUpdated: Object.keys(data) });

    return updated;
  }

  /**
   * Toggle isActive flag on a discount.
   */
  static async toggleActive(id: string): Promise<Discount> {
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");
    const updated = await prisma.discount.update({ where: { id }, data: { isActive: !existing.isActive } });
    
    const actorId = await getSystemUserId();
    await AuditLogService.log("UPDATE", "Discount", id, actorId, { name: updated.name, isActive: updated.isActive });

    return updated;
  }

  /**
   * Permanently delete a discount. Fails if it has been used in any bill item.
   */
  static async delete(id: string): Promise<void> {
    const existing = await prisma.discount.findUnique({ where: { id }, include: { billItems: { take: 1 } } });
    if (!existing) throw new Error("NOT_FOUND");
    if (existing.billItems.length > 0) throw new Error("IN_USE");
    await prisma.discount.delete({ where: { id } });

    const actorId = await getSystemUserId();
    await AuditLogService.log("DELETE", "Discount", id, actorId, { name: existing.name });
  }
}

