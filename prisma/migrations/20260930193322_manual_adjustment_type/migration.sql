-- CreateEnum
CREATE TYPE "ManualAdjustmentType" AS ENUM ('ADJUSTMENTS', 'FRIENDS', 'ROUND_OFF', 'OTHERS');

-- AlterTable
ALTER TABLE "bill_items" ADD COLUMN     "manualAdjustmentType" "ManualAdjustmentType";

-- Backfill existing manual adjustments
UPDATE "bill_items"
SET "manualAdjustmentType" = 
  CASE 
    WHEN description ILIKE 'Adjustments%' THEN 'ADJUSTMENTS'::"ManualAdjustmentType"
    WHEN description ILIKE 'Friends%' THEN 'FRIENDS'::"ManualAdjustmentType"
    WHEN description ILIKE 'Round Off%' THEN 'ROUND_OFF'::"ManualAdjustmentType"
    ELSE 'OTHERS'::"ManualAdjustmentType"
  END
WHERE type IN ('MANUAL_CREDIT', 'MANUAL_CHARGE');
