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

    return { customers: customers as CustomerListItem[], total };
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
