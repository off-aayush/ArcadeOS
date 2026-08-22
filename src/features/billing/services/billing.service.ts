import { prisma } from "@/lib/prisma";
import { BillWithDetails, BillListItem, BillQueryParams, RecordPaymentInput, ApplyDiscountInput, AddAdjustmentInput } from "../types";
import { Prisma, BillStatus } from "@prisma/client";
import {
  calculateSessionAmount,
  generateBillNumber,
  getRoundingDiff,
  roundBill,
} from "@/lib/utils";
import { DEFAULT_PAGE_SIZE, MIN_BILLABLE_MS } from "@/lib/constants";
import { emitSocketEvent } from "@/lib/socket-emitter";

// ── Shared include shape for full bill detail ─────────────────────────────────
const BILL_DETAIL_INCLUDE = {
  items: {
    include: {
      foodItem: true,
      discount: true,
    },
  },
  payments: true,
  session: {
    include: {
      station: { select: { id: true, name: true, type: true } },
      customer: { select: { id: true, name: true, phone: true } },
    },
    // We explicitly select everything plus the relations above to ensure playerCount is returned,
    // actually Prisma include already selects all scalars.
  },
  issuedBy: { select: { id: true, name: true } },
} satisfies Prisma.BillInclude;

// ── Shared include shape for list rows ────────────────────────────────────────
const BILL_LIST_INCLUDE = {
  session: {
    include: {
      station: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.BillInclude;

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

/** Derive the next sequence number for today's bills */
async function nextBillSequence(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await prisma.bill.count({
    where: { createdAt: { gte: today } },
  });
  return count + 1;
}

export class BillingService {
  /**
   * Generate/finalise an invoice for a completed session.
   *
   * Two paths:
   *  A) No existing bill  → create a brand-new PENDING bill with SESSION_TIME + rounding.
   *  B) Existing DRAFT bill (pre-ordered food items) → append SESSION_TIME, recalculate
   *     totals, and promote the bill to PENDING.
   *
   * All DB writes happen inside a single transaction.
   */
  static async generateBill(sessionId: string): Promise<BillWithDetails> {
    // 1. Load session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        bill: true,
        station: { select: { id: true, name: true, type: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!session) throw new Error("Session not found");
    if (session.status !== "COMPLETED") {
      throw new Error("Can only generate a bill for a COMPLETED session");
    }
    if (session.bill && session.bill.status !== "DRAFT") {
      throw new Error(`A bill already exists for this session (${session.bill.id})`);
    }
    if (!session.endTime) {
      throw new Error("Session has no end time — cannot calculate duration");
    }

    // 2. Calculate billable duration (exclude paused time)
    const totalMs =
      session.endTime.getTime() -
      session.startTime.getTime() -
      session.totalPausedMs;
    const billableMs = Math.max(totalMs, MIN_BILLABLE_MS);

    // 3. Calculate the time charge
    const ratePerHour = Number(session.ratePerHour);
    const sessionChargeExact = calculateSessionAmount(billableMs, ratePerHour);
    const sessionCharge = Math.round(sessionChargeExact * 100) / 100; // 2dp

    const actorId = await getSystemUserId();

    // ── PATH B: DRAFT bill exists (food items already added) ─────────────────
    if (session.bill && session.bill.status === "DRAFT") {
      const existingBillId = session.bill.id;

      const bill = await prisma.$transaction(async (tx) => {
        // Append the SESSION_TIME item
        await tx.billItem.create({
          data: {
            billId: existingBillId,
            type: "SESSION_TIME",
            description: `Gaming session — ${session.station.name} (${session.playerCount} Player${session.playerCount > 1 ? 's' : ''})`,
            quantity: 1,
            unitPrice: sessionCharge,
            totalPrice: sessionCharge,
          },
        });

        // Recalculate totals (removes old rounding, adds fresh one)
        await BillingService.recalculateBillTotals(tx, existingBillId);

        // Promote to PENDING
        const finalBill = await tx.bill.update({
          where: { id: existingBillId },
          data: { status: "PENDING" },
          include: BILL_DETAIL_INCLUDE,
        });

        return finalBill;
      });

      emitSocketEvent("invalidate_bills");
      return bill as BillWithDetails;
    }

    // ── PATH A: No bill yet — create fresh ───────────────────────────────────
    const grandTotalExact = sessionCharge;
    const grandTotal = roundBill(grandTotalExact);
    const roundingAmount = getRoundingDiff(grandTotalExact);

    const sequence = await nextBillSequence();
    const billNumber = generateBillNumber(sequence);

    const bill = await prisma.$transaction(async (tx) => {
      const newBill = await tx.bill.create({
        data: {
          billNumber,
          status: "PENDING",
          sessionId,
          issuedById: actorId,
          subtotal: sessionCharge,
          discountTotal: 0,
          adjustmentTotal: 0,
          roundingAmount,
          grandTotal,
          amountPaid: 0,
          amountDue: grandTotal,
          items: {
            create: {
              type: "SESSION_TIME",
              description: `Gaming session — ${session.station.name} (${session.playerCount} Player${session.playerCount > 1 ? 's' : ''})`,
              quantity: 1,
              unitPrice: sessionCharge,
              totalPrice: sessionCharge,
            },
            ...(roundingAmount !== 0
              ? {
                  createMany: {
                    data: [
                      {
                        type: "ROUNDING",
                        description: "Rounding adjustment",
                        quantity: 1,
                        unitPrice: roundingAmount,
                        totalPrice: roundingAmount,
                      },
                    ],
                  },
                }
              : {}),
          },
        },
        include: BILL_DETAIL_INCLUDE,
      });
      return newBill;
    });

    return bill as BillWithDetails;
  }

  /**
   * Paginated list of bills with optional status filter.
   */
  static async getAll(
    params: BillQueryParams = {}
  ): Promise<{ bills: BillListItem[]; total: number }> {
    const { status = "ALL", page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

    const where: Prisma.BillWhereInput = {};
    if (status !== "ALL") where.status = status as BillStatus;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: BILL_LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.bill.count({ where }),
    ]);

    return { bills: bills as unknown as BillListItem[], total };
  }

  /**
   * Fetch a single bill with all line items, payments, and session context.
   */
  static async getById(id: string): Promise<BillWithDetails | null> {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: BILL_DETAIL_INCLUDE,
    });
    return bill as BillWithDetails | null;
  }
  /**
   * Record a payment against an existing bill.
   * Runs in a transaction to safely update bill totals and status.
   */
  static async recordPayment(billId: string, input: RecordPaymentInput): Promise<BillWithDetails> {
    const actorId = await getSystemUserId(); // Simplified for now (ideally from auth session)

    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      
      if (!bill) {
        throw new Error("Bill not found");
      }
      
      if (Number(bill.amountDue) <= 0) {
        throw new Error("Bill is already fully paid");
      }

      if (input.amount > Number(bill.amountDue)) {
        throw new Error(`Payment amount (${input.amount}) exceeds amount due (${bill.amountDue})`);
      }

      // 1. Create the Payment record
      await tx.payment.create({
        data: {
          billId,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          notes: input.notes,
          receivedById: actorId,
          status: "COMPLETED",
        },
      });

      // 2. Calculate new totals
      const newAmountPaid = Number(bill.amountPaid) + input.amount;
      const newAmountDue = Number(bill.grandTotal) - newAmountPaid;
      
      // Determine new status
      let newStatus: BillStatus = bill.status;
      let paidAt = bill.paidAt;

      if (newAmountDue <= 0) {
        newStatus = "PAID";
        paidAt = new Date();
      } else {
        newStatus = "PARTIALLY_PAID";
      }

      // 3. Update the Bill
      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paidAt,
        },
        include: BILL_DETAIL_INCLUDE,
      });

      // 4. Update Customer Stats
      if (bill.sessionId) {
        const session = await tx.session.findUnique({ where: { id: bill.sessionId } });
        if (session && session.customerId) {
          // Only increment visits if this is the FIRST payment on the bill
          const isFirstPayment = Number(bill.amountPaid) === 0;

          await tx.customer.update({
            where: { id: session.customerId },
            data: {
              totalSpend: { increment: input.amount },
              ...(isFirstPayment ? { totalVisits: { increment: 1 } } : {}),
            },
          });
        }
      }

      return updatedBill;
    });

    return result as BillWithDetails;
  }

  // ── Shared: recalculate bill totals from line items ─────────────────────────
  private static async recalculateBillTotals(
    tx: Prisma.TransactionClient,
    billId: string
  ): Promise<void> {
    const items = await tx.billItem.findMany({ where: { billId } });

    let subtotal = 0;
    let discountTotal = 0;
    let adjustmentTotal = 0;
    let roundingAmount = 0;

    for (const item of items) {
      const total = Number(item.totalPrice);
      switch (item.type) {
        case "SESSION_TIME":
        case "FOOD":
        case "DRINK":
          subtotal += total;
          break;
        case "DISCOUNT":
          discountTotal += Math.abs(total); // stored as negative
          break;
        case "MANUAL_CREDIT":
          adjustmentTotal -= Math.abs(total);
          break;
        case "MANUAL_CHARGE":
          adjustmentTotal += total;
          break;
        case "ROUNDING":
          roundingAmount += total;
          break;
      }
    }

    // Remove old rounding items to recalculate
    await tx.billItem.deleteMany({ where: { billId, type: "ROUNDING" } });

    // Recompute grand total before rounding
    const preRoundTotal = subtotal - discountTotal + adjustmentTotal;
    const grandTotal = roundBill(preRoundTotal);
    const newRounding = getRoundingDiff(preRoundTotal);

    // Insert new rounding item if non-zero
    if (newRounding !== 0) {
      await tx.billItem.create({
        data: {
          billId,
          type: "ROUNDING",
          description: "Rounding adjustment",
          quantity: 1,
          unitPrice: newRounding,
          totalPrice: newRounding,
        },
      });
    }

    // Fetch current bill for amountPaid
    const currentBill = await tx.bill.findUniqueOrThrow({ where: { id: billId } });
    const amountPaid = Number(currentBill.amountPaid);
    const amountDue = grandTotal - amountPaid;

    await tx.bill.update({
      where: { id: billId },
      data: {
        subtotal,
        discountTotal,
        adjustmentTotal,
        roundingAmount: newRounding,
        grandTotal,
        amountDue: Math.max(0, amountDue),
      },
    });
  }

  /**
   * Apply a named discount template or a custom fixed amount to a bill.
   */
  static async applyDiscount(billId: string, input: ApplyDiscountInput): Promise<BillWithDetails> {
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error("Bill not found");
      if (bill.status === "PAID" || bill.status === "VOIDED") {
        throw new Error("Cannot modify a PAID or VOIDED bill");
      }

      let discountAmount: number;
      let description: string;
      let discountId: string | null = null;

      if (input.discountId) {
        // Named discount template
        const discount = await tx.discount.findUnique({ where: { id: input.discountId } });
        if (!discount || !discount.isActive) {
          throw new Error("Discount template not found or inactive");
        }

        const subtotal = Number(bill.subtotal);

        // Validate minimum bill amount
        if (discount.minBillAmount && subtotal < Number(discount.minBillAmount)) {
          throw new Error(`Bill subtotal (₹${subtotal}) is below the minimum of ₹${discount.minBillAmount}`);
        }

        const currentPayable = Number(bill.subtotal) - Number(bill.discountTotal) + Number(bill.adjustmentTotal);
        if (currentPayable <= 0) {
          throw new Error("Cannot apply discount. Payable amount is already zero.");
        }

        if (discount.type === "PERCENTAGE") {
          discountAmount = currentPayable * Number(discount.value) / 100;
          // Cap at maxAmount if defined
          if (discount.maxAmount && discountAmount > Number(discount.maxAmount)) {
            discountAmount = Number(discount.maxAmount);
          }
          description = `${discount.name} (${discount.value}%)`;
        } else {
          // FIXED_AMOUNT
          discountAmount = Number(discount.value);
          description = `${discount.name} (flat)`;
        }

        discountAmount = Math.min(discountAmount, currentPayable);
        discountId = discount.id;
      } else if (input.customAmount) {
        const currentPayable = Number(bill.subtotal) - Number(bill.discountTotal) + Number(bill.adjustmentTotal);
        if (currentPayable <= 0) {
          throw new Error("Cannot apply discount. Payable amount is already zero.");
        }
        discountAmount = Math.min(input.customAmount, currentPayable);
        description = `Custom discount`;
      } else {
        throw new Error("Either discountId or customAmount must be provided");
      }

      // Round to 2dp
      discountAmount = Math.round(discountAmount * 100) / 100;

      // Create the discount line item (negative totalPrice)
      await tx.billItem.create({
        data: {
          billId,
          type: "DISCOUNT",
          description: input.notes ? `${description} — ${input.notes}` : description,
          quantity: 1,
          unitPrice: -discountAmount,
          totalPrice: -discountAmount,
          discountId,
        },
      });

      // Recalculate all bill totals
      await BillingService.recalculateBillTotals(tx, billId);

      return tx.bill.findUniqueOrThrow({
        where: { id: billId },
        include: BILL_DETAIL_INCLUDE,
      });
    });

    return result as BillWithDetails;
  }

  /**
   * Add a manual credit or charge adjustment to a bill.
   */
  static async addAdjustment(billId: string, input: AddAdjustmentInput): Promise<BillWithDetails> {
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error("Bill not found");
      if (bill.status === "PAID" || bill.status === "VOIDED") {
        throw new Error("Cannot modify a PAID or VOIDED bill");
      }

      const isCredit = input.type === "MANUAL_CREDIT";
      const amount = Math.round(input.amount * 100) / 100;

      await tx.billItem.create({
        data: {
          billId,
          type: input.type,
          description: input.notes ? `${input.description} — ${input.notes}` : input.description,
          quantity: 1,
          unitPrice: isCredit ? -amount : amount,
          totalPrice: isCredit ? -amount : amount,
        },
      });

      await BillingService.recalculateBillTotals(tx, billId);

      return tx.bill.findUniqueOrThrow({
        where: { id: billId },
        include: BILL_DETAIL_INCLUDE,
      });
    });

    return result as BillWithDetails;
  }

  /**
   * Remove a specific discount or manual adjustment item from the bill.
   */
  static async removeBillItem(billId: string, itemId: string): Promise<BillWithDetails> {
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error("Bill not found");
      if (bill.status === "PAID" || bill.status === "VOIDED") {
        throw new Error("Cannot modify a PAID or VOIDED bill");
      }

      const item = await tx.billItem.findUnique({ where: { id: itemId } });
      if (!item || item.billId !== billId) {
        throw new Error("Item not found on this bill");
      }
      
      if (item.type !== "DISCOUNT" && item.type !== "MANUAL_CREDIT" && item.type !== "MANUAL_CHARGE") {
        throw new Error("Can only manually remove discounts and manual adjustments via this method");
      }

      await tx.billItem.delete({ where: { id: itemId } });

      await BillingService.recalculateBillTotals(tx, billId);

      return tx.bill.findUniqueOrThrow({
        where: { id: billId },
        include: BILL_DETAIL_INCLUDE,
      });
    });

    return result as BillWithDetails;
  }


  // ────────────────────────────────────────────────────────────────────────────
  // ORDER ITEM MANAGEMENT (pre-session food/drink ordering)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Add a food/drink item to an ACTIVE or PAUSED session.
   * Creates a DRAFT bill for the session if one does not yet exist.
   * If the same food item is already on the bill, increments the quantity instead.
   * Decrements food stock atomically in the same transaction.
   */
  static async addOrderItem(
    sessionId: string,
    foodItemId: string,
    quantity: number
  ): Promise<BillWithDetails> {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate session
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: {
          bill: true,
          station: { select: { id: true, name: true, type: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });
      if (!session) throw new Error("Session not found");
      if (
        session.status !== "ACTIVE" &&
        session.status !== "PAUSED" &&
        session.status !== "COMPLETED"
      ) {
        throw new Error("Items can only be added to ACTIVE, PAUSED, or COMPLETED sessions");
      }

      // 2. Validate food item & stock
      const foodItem = await tx.foodItem.findFirst({
        where: { id: foodItemId, deletedAt: null, isAvailable: true },
      });
      if (!foodItem) throw new Error("Product not found or unavailable");
      if (foodItem.stock < quantity) {
        throw new Error(
          `Insufficient stock. Only ${foodItem.stock} unit(s) available.`
        );
      }

      const actorId = await getSystemUserId();

      // 3. Get or create the DRAFT bill
      let billId: string;
      let billNumber: string;
      if (session.bill) {
        if (session.bill.status !== "DRAFT" && session.bill.status !== "PENDING") {
          throw new Error("Cannot add items to a PAID or VOIDED bill");
        }
        billId = session.bill.id;
        billNumber = session.bill.billNumber;
      } else {
        // Create draft bill
        const sequence = await nextBillSequence();
        billNumber = generateBillNumber(sequence);
        const draft = await tx.bill.create({
          data: {
            billNumber,
            status: "DRAFT",
            sessionId,
            issuedById: actorId,
            subtotal: 0,
            discountTotal: 0,
            adjustmentTotal: 0,
            roundingAmount: 0,
            grandTotal: 0,
            amountPaid: 0,
            amountDue: 0,
          },
        });
        billId = draft.id;
      }

      // 4. Check if this food item already exists on the bill
      const existing = await tx.billItem.findFirst({
        where: { billId, foodItemId },
      });

      const itemType =
        foodItem.category === "BEVERAGES_HOT" ||
        foodItem.category === "BEVERAGES_COLD"
          ? "DRINK"
          : "FOOD";
      const unitPrice = Number(foodItem.price);

      if (existing) {
        // Increment quantity
        const newQty = Number(existing.quantity) + quantity;
        await tx.billItem.update({
          where: { id: existing.id },
          data: {
            quantity: newQty,
            totalPrice: unitPrice * newQty,
          },
        });
      } else {
        // Create new line item (price snapshot at add time)
        await tx.billItem.create({
          data: {
            billId,
            type: itemType as "FOOD" | "DRINK",
            description: foodItem.name,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
            foodItemId,
          },
        });
      }

      // 5. Decrement stock
      await tx.foodItem.update({
        where: { id: foodItemId },
        data: { stock: { decrement: quantity } },
      });

      // 6. Recalculate bill totals
      await BillingService.recalculateBillTotals(tx, billId);

      return tx.bill.findUniqueOrThrow({
        where: { id: billId },
        include: BILL_DETAIL_INCLUDE,
      });
    });

    emitSocketEvent("invalidate_stations");
    emitSocketEvent("invalidate_bills");
    return result as BillWithDetails;
  }

  /**
   * Update the quantity of an existing food/drink bill item.
   * Adjusts inventory stock by the delta.
   */
  static async updateOrderItem(
    billItemId: string,
    newQuantity: number
  ): Promise<BillWithDetails> {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.billItem.findUnique({ where: { id: billItemId } });
      if (!item) throw new Error("Order item not found");
      if (item.type !== "FOOD" && item.type !== "DRINK") {
        throw new Error("Only food/drink items can be updated this way");
      }
      if (!item.foodItemId) throw new Error("Item has no linked food product");

      // Validate bill is still editable
      const bill = await tx.bill.findUniqueOrThrow({ where: { id: item.billId } });
      if (bill.status !== "DRAFT" && bill.status !== "PENDING") {
        throw new Error("Cannot modify items on a PAID or VOIDED bill");
      }

      const oldQty = Number(item.quantity);
      const delta = newQuantity - oldQty; // positive = more, negative = return

      if (delta > 0) {
        // Check stock for the additional units
        const foodItem = await tx.foodItem.findUnique({ where: { id: item.foodItemId } });
        if (!foodItem || foodItem.stock < delta) {
          throw new Error(
            `Insufficient stock. Only ${
              foodItem?.stock ?? 0
            } additional unit(s) available.`
          );
        }
        await tx.foodItem.update({
          where: { id: item.foodItemId },
          data: { stock: { decrement: delta } },
        });
      } else if (delta < 0) {
        // Return stock
        await tx.foodItem.update({
          where: { id: item.foodItemId },
          data: { stock: { increment: Math.abs(delta) } },
        });
      }

      await tx.billItem.update({
        where: { id: billItemId },
        data: {
          quantity: newQuantity,
          totalPrice: Number(item.unitPrice) * newQuantity,
        },
      });

      await BillingService.recalculateBillTotals(tx, item.billId);

      return tx.bill.findUniqueOrThrow({
        where: { id: item.billId },
        include: BILL_DETAIL_INCLUDE,
      });
    });

    emitSocketEvent("invalidate_stations");
    emitSocketEvent("invalidate_bills");
    return result as BillWithDetails;
  }

  /**
   * Remove a food/drink item from the bill and return its stock.
   */
  static async removeOrderItem(billItemId: string): Promise<BillWithDetails> {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.billItem.findUnique({ where: { id: billItemId } });
      if (!item) throw new Error("Order item not found");
      if (item.type !== "FOOD" && item.type !== "DRINK") {
        throw new Error("Only food/drink items can be removed this way");
      }

      const bill = await tx.bill.findUniqueOrThrow({ where: { id: item.billId } });
      if (bill.status !== "DRAFT" && bill.status !== "PENDING") {
        throw new Error("Cannot modify items on a PAID or VOIDED bill");
      }

      // Return stock
      if (item.foodItemId) {
        await tx.foodItem.update({
          where: { id: item.foodItemId },
          data: { stock: { increment: Number(item.quantity) } },
        });
      }

      await tx.billItem.delete({ where: { id: billItemId } });

      await BillingService.recalculateBillTotals(tx, item.billId);

      return tx.bill.findUniqueOrThrow({
        where: { id: item.billId },
        include: BILL_DETAIL_INCLUDE,
      });
    });

    emitSocketEvent("invalidate_stations");
    emitSocketEvent("invalidate_bills");
    return result as BillWithDetails;
  }

  /**
   * Get the current editable bill for a session (if any), with all items.
   * Editable bills are DRAFT (during session) or PENDING (after stop but before payment).
   */
  static async getEditableBillForSession(sessionId: string): Promise<BillWithDetails | null> {
    const bill = await prisma.bill.findFirst({
      where: { sessionId, status: { in: ["DRAFT", "PENDING"] } },
      include: BILL_DETAIL_INCLUDE,
    });
    return bill as BillWithDetails | null;
  }
}
