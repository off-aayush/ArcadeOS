-- Additive expense ledger; existing customer, billing, and inventory data is untouched.
CREATE TABLE "spendings" (
    "id" TEXT NOT NULL,
    "requestKey" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "spendings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "spendings_amount_positive" CHECK ("amount" > 0)
);

CREATE INDEX "spendings_spentAt_id_idx" ON "spendings"("spentAt", "id");
CREATE UNIQUE INDEX "spendings_requestKey_key" ON "spendings"("requestKey");
CREATE INDEX "spendings_createdById_idx" ON "spendings"("createdById");
CREATE INDEX "spendings_updatedById_idx" ON "spendings"("updatedById");

ALTER TABLE "spendings" ADD CONSTRAINT "spendings_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "spendings" ADD CONSTRAINT "spendings_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
