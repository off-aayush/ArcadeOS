import { prisma } from "@/lib/prisma";
import { BillWithDetails, BillListItem, BillQueryParams } from "../types";
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

async function getSystemUserId(): Promise<string> {
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
}
