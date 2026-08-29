-- CreateTable
CREATE TABLE "parlour_profile" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'My Arcade',
    "tagline" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "gstin" TEXT,
    "receiptFooter" TEXT,
    "logoUrl" TEXT,
    "currencySymbol" TEXT NOT NULL DEFAULT '₹',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parlour_profile_pkey" PRIMARY KEY ("id")
);
