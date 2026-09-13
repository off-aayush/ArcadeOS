-- DropForeignKey
ALTER TABLE "bills" DROP CONSTRAINT "bills_sessionId_fkey";

-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "customerId" TEXT,
ALTER COLUMN "sessionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "name" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
