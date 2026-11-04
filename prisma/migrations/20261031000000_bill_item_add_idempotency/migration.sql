ALTER TABLE "bill_items" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "bill_items_idempotencyKey_key" ON "bill_items"("idempotencyKey");
