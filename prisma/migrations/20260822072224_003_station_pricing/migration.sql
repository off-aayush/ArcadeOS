-- CreateTable
CREATE TABLE "station_pricings" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "ratePerHour" DECIMAL(10,2) NOT NULL,
    "ratePerMinute" DECIMAL(10,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "station_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "station_pricings_stationId_idx" ON "station_pricings"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "station_pricings_stationId_playerCount_key" ON "station_pricings"("stationId", "playerCount");

-- AddForeignKey
ALTER TABLE "station_pricings" ADD CONSTRAINT "station_pricings_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: Backfill 1-player pricing from existing station.ratePerHour
-- This ensures historical stations have a StationPricing row for playerCount=1
-- ON CONFLICT DO NOTHING makes this idempotent (safe to re-run)
INSERT INTO "station_pricings" ("id", "stationId", "playerCount", "ratePerHour", "isActive", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  id,
  1,
  "ratePerHour",
  true,
  NOW(),
  NOW()
FROM "stations"
WHERE "isActive" = true AND "deletedAt" IS NULL
ON CONFLICT ("stationId", "playerCount") DO NOTHING;
