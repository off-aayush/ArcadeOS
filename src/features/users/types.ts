// ─────────────────────────────────────────────────────────────────────────────
// Users Feature — Types
// ─────────────────────────────────────────────────────────────────────────────

import type { Permission } from "@prisma/client";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  role: {
    id: string;
    name: string;
    permissions: Permission[];
  };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface ChangePasswordInput {
  userId: string;
  newPassword: string;
}
