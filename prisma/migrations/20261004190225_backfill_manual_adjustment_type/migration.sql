-- Backfill existing manual adjustment categories.
-- Data-only migration; existing schema is unchanged.

UPDATE "bill_items"
SET "manualAdjustmentType" =
  CASE
    WHEN LOWER(TRIM("description")) LIKE 'adjustment%'
      THEN 'ADJUSTMENTS'::"ManualAdjustmentType"

    WHEN LOWER(TRIM("description")) LIKE 'friend discount%'
      OR LOWER(TRIM("description")) LIKE 'friend%'
      THEN 'FRIENDS'::"ManualAdjustmentType"

    WHEN LOWER(TRIM("description")) LIKE 'round off%'
      OR LOWER(TRIM("description")) LIKE 'roundoff%'
      THEN 'ROUND_OFF'::"ManualAdjustmentType"

    ELSE 'OTHERS'::"ManualAdjustmentType"
  END
WHERE "type" IN ('MANUAL_CREDIT', 'MANUAL_CHARGE');