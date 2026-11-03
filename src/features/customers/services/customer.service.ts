import { prisma } from "@/lib/prisma";
import { CustomerQueryParams, CustomerListItem, CustomerDetail } from "../types";
import { Prisma, Customer } from "@prisma/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export class CustomerService {
  /**
   * Retrieves paginated list of customers with membership and session count.
   */
  static async getAll(params: CustomerQueryParams = {}): Promise<{ customers: CustomerListItem[]; total: number }> {
    const {
      search,
      status = "active",
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = params;

    const whereClause: Prisma.CustomerWhereInput = {};

    if (status === "active") {
      whereClause.isActive = true;
      whereClause.deletedAt = null;
    } else if (status === "inactive") {
      whereClause.isActive = false;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          membership: true,
          sessions: {
            where: { status: { in: ["ACTIVE", "PAUSED"] } },
            select: { id: true, station: { select: { name: true } } }
          },
          _count: {
            select: { sessions: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    const visitCounts = customers.length
      ? await prisma.session.groupBy({
          by: ["customerId"],
          where: {
            customerId: { in: customers.map((customer) => customer.id) },
            status: "COMPLETED",
          },
          _count: { _all: true },
        })
      : [];
    const countsByCustomer = new Map(
      visitCounts.map((item) => [item.customerId, item._count._all])
    );

    return {
      customers: customers.map((customer) => ({
        ...customer,
        totalVisits: countsByCustomer.get(customer.id) ?? 0,
      })) as CustomerListItem[],
      total,
    };
  }

  /** Groups every completed session by its start date in the parlour timezone. */
  static async getVisitHistory(id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!customer) return null;

    const profile = await prisma.parlourProfile.findUnique({
      where: { id: "singleton" },
      select: { timezone: true },
    });
    const requestedTimezone = profile?.timezone || "Asia/Kolkata";
    let timezone = requestedTimezone;
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
    } catch {
      timezone = "Asia/Kolkata";
    }

    const days = await prisma.$queryRaw<{ date: string; count: number }[]> `
      SELECT to_char("startTime" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone}, 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM "sessions"
      WHERE "customerId" = ${id} AND "status" = 'COMPLETED'
      GROUP BY 1
      ORDER BY 1
    `;
    return {
      days,
      total: days.reduce((sum, day) => sum + day.count, 0),
      timezone,
      currentYear: Number(
        new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric" })
          .format(new Date())
      ),
    };
  }

  /**
   * Retrieves a single customer by ID including session history.
   */
  static async getById(id: string): Promise<CustomerDetail | null> {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        membership: true,
        sessions: {
          include: {
            bill: {
              select: { grandTotal: true },
            },
          },
          orderBy: { startTime: "desc" },
          take: 20,
        },
      },
    });
    return customer as CustomerDetail | null;
  }

  /**
   * Creates a new customer.
   */
  static async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return prisma.customer.create({ data });
  }

  /**
   * Updates an existing customer.
   */
  static async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    const current = await prisma.customer.findUnique({ where: { id } });
    if (!current) throw new Error("Customer not found");

    return prisma.customer.update({ where: { id }, data });
  }

  /**
   * Soft-deletes a customer, preserving billing history.
   */
  static async delete(id: string): Promise<Customer> {
    const current = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        sessions: { where: { status: "ACTIVE" } },
      },
    });

    if (!current) throw new Error("Customer not found");
    if (current.sessions.length > 0) {
      throw new Error("Cannot delete a customer with an active session");
    }

    return prisma.customer.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
