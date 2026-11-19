-- Existing spending records are preserved and backfilled as CASH.
ALTER TABLE "spendings"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';
