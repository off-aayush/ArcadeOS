// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — User Service
// Handles user management: CRUD, role assignment, activation/deactivation.
// Business rules enforced here (not just in API layer).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserListItem } from "../types";
import { CreateUserInput, UpdateUserInput } from "../validators";

const USER_INCLUDE = {
  role: {
    select: { id: true, name: true, permissions: true },
  },
} as const;

export class UserService {
  /**
   * List all non-deleted users with their role and permissions.
   */
  static async getAll(): Promise<UserListItem[]> {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: USER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return users;
  }

  /**
   * Get a single user by ID (non-deleted).
   */
  static async getById(id: string): Promise<UserListItem | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: USER_INCLUDE,
    });
  }

  /**
   * Create a new user. Caller is responsible for verifying they have
   * MANAGE_USERS permission and that the target role doesn't exceed their own.
   */
  static async create(input: CreateUserInput): Promise<UserListItem> {
    // Check email uniqueness
    const existing = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase().trim(), deletedAt: null },
    });
    if (existing) {
      throw new Error("EMAIL_TAKEN");
    }

    // Validate role exists
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) throw new Error("ROLE_NOT_FOUND");

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        roleId: input.roleId,
        phone: input.phone?.trim() || null,
        isActive: true,
      },
      include: USER_INCLUDE,
    });

    return user;
  }

  /**
   * Update a user's profile, role, or status.
   * Prevents deactivating/changing role of the last SUPER_ADMIN.
   */
  static async update(id: string, input: UpdateUserInput): Promise<UserListItem> {
    const target = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
    if (!target) throw new Error("USER_NOT_FOUND");

    // Prevent removing the last active SUPER_ADMIN
    if (target.role.name === "SUPER_ADMIN") {
      const isTryingToDeactivate = input.isActive === false;
      const isTryingToChangeRole = input.roleId && input.roleId !== target.roleId;

      if (isTryingToDeactivate || isTryingToChangeRole) {
        const superAdminCount = await prisma.user.count({
          where: {
            role: { name: "SUPER_ADMIN" },
            isActive: true,
            deletedAt: null,
          },
        });
        if (superAdminCount <= 1) {
          throw new Error("LAST_SUPER_ADMIN");
        }
      }
    }

    // Validate new role if changing
    if (input.roleId) {
      const role = await prisma.role.findUnique({ where: { id: input.roleId } });
      if (!role) throw new Error("ROLE_NOT_FOUND");
    }

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.email !== undefined) updateData.email = input.email.toLowerCase().trim();
    if (input.phone !== undefined) updateData.phone = input.phone?.trim() || null;
    if (input.roleId !== undefined) updateData.roleId = input.roleId;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: USER_INCLUDE,
    });

    return updated;
  }

  /**
   * Change a user's password. Requires MANAGE_USERS permission on caller side.
   */
  static async changePassword(userId: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /**
   * Soft-delete a user. Prevents deleting the last SUPER_ADMIN.
   */
  static async delete(id: string): Promise<void> {
    const target = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
    if (!target) throw new Error("USER_NOT_FOUND");

    if (target.role.name === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: {
          role: { name: "SUPER_ADMIN" },
          isActive: true,
          deletedAt: null,
        },
      });
      if (superAdminCount <= 1) {
        throw new Error("LAST_SUPER_ADMIN");
      }
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /**
   * Get all available roles for assignment.
   */
  static async getRoles() {
    return prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  }
}
