/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('VIEW_DASHBOARD', 'MANAGE_STATIONS', 'MANAGE_SESSIONS', 'MANAGE_CUSTOMERS', 'MANAGE_BILLING', 'MANAGE_INVENTORY', 'VIEW_REPORTS', 'MANAGE_DISCOUNTS', 'MANAGE_USERS', 'VIEW_AUDIT_LOGS', 'MANAGE_SETTINGS', 'MANAGE_PARLOUR_PROFILE');

-- DropIndex
DROP INDEX "users_role_idx";

-- CreateTable (moved up before AlterTable users)
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" "Permission"[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Insert default system roles
INSERT INTO "roles" ("id", "name", "description", "isSystem", "updatedAt", "permissions") VALUES
('role_super_admin', 'SUPER_ADMIN', 'Unrestricted system access', true, NOW(), ARRAY['VIEW_DASHBOARD', 'MANAGE_STATIONS', 'MANAGE_SESSIONS', 'MANAGE_CUSTOMERS', 'MANAGE_BILLING', 'MANAGE_INVENTORY', 'VIEW_REPORTS', 'MANAGE_DISCOUNTS', 'MANAGE_USERS', 'VIEW_AUDIT_LOGS', 'MANAGE_SETTINGS', 'MANAGE_PARLOUR_PROFILE']::"Permission"[]),
('role_admin', 'ADMIN', 'Administrative access', true, NOW(), ARRAY['VIEW_DASHBOARD', 'MANAGE_STATIONS', 'MANAGE_SESSIONS', 'MANAGE_CUSTOMERS', 'MANAGE_BILLING', 'MANAGE_INVENTORY', 'VIEW_REPORTS', 'MANAGE_DISCOUNTS', 'VIEW_AUDIT_LOGS']::"Permission"[]),
('role_receptionist', 'RECEPTIONIST', 'Front-desk staff', true, NOW(), ARRAY['VIEW_DASHBOARD', 'MANAGE_STATIONS', 'MANAGE_SESSIONS', 'MANAGE_CUSTOMERS', 'MANAGE_BILLING']::"Permission"[]);

-- Add roleId allowing null temporarily
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

-- Data Migration: Set roleId for existing users
UPDATE "users" SET "roleId" = 'role_super_admin' WHERE "role"::text = 'SUPER_ADMIN';
UPDATE "users" SET "roleId" = 'role_admin' WHERE "role"::text = 'ADMIN';
UPDATE "users" SET "roleId" = 'role_receptionist' WHERE "role"::text = 'RECEPTIONIST';

-- Default fallback just in case
UPDATE "users" SET "roleId" = 'role_receptionist' WHERE "roleId" IS NULL;

-- Now make roleId NOT NULL and drop old role
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "users" DROP COLUMN "role";

-- DropEnum
DROP TYPE "UserRole";



-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
