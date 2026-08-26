import { prisma } from "@/lib/prisma";
import { AuthUser, SessionUser } from "../types";
import bcrypt from "bcryptjs";

export class AuthService {
  /**
   * Verify email and password. Returns the user without password hash on success.
   * Throws descriptive errors on failure (caller should not expose raw messages to client).
   */
  static async login(email: string, password: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error("Your account has been deactivated. Contact an administrator.");
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error("Invalid email or password");
    }

    // Update lastLoginAt timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions,
      },
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Fetch a user by ID for session rehydration.
   * Returns null if not found or inactive.
   */
  static async getById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: { role: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions,
      },
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Convert an AuthUser to the compact SessionUser payload stored in the JWT.
   */
  static toSessionUser(user: AuthUser): SessionUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
