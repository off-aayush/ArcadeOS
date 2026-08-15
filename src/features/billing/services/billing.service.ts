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
   * Generate an invoice for a completed session.
   * - Validates session is COMPLETED and has no existing bill.
   * - Calculates billable time in hours.
   * - Creates a Bill with a single SESSION_TIME BillItem.
   * - Applies rounding to the nearest whole rupee.
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
    if (session.bill) {
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

    // 4. Apply rounding
    const grandTotalExact = sessionCharge;
    const grandTotal = roundBill(grandTotalExact);
    const roundingAmount = getRoundingDiff(grandTotalExact);

    // 5. Resolve issuer + bill number
    const actorId = await getSystemUserId();
    const sequence = await nextBillSequence();
    const billNumber = generateBillNumber(sequence);

    // 6. Write everything in one transaction
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
              description: `Gaming session — ${session.station.name}`,
              quantity: 1,
              unitPrice: sessionCharge,
              totalPrice: sessionCharge,
            },
            // Rounding line (only when non-zero)
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

        if (discount.type === "PERCENTAGE") {
          discountAmount = subtotal * Number(discount.value) / 100;
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

        discountId = discount.id;
      } else if (input.customAmount) {
        discountAmount = input.customAmount;
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
}
