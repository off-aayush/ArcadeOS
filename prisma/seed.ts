// ─────────────────────────────────────────────────────────────────────────────
// ArcadeOS — Prisma Seed Script
// Run with: npm run db:seed
// Creates a minimal development dataset:
//   • 1 Admin user
//   • 10 Gaming stations (mixed types)
//   • 6 Food catalogue items
//   • 3 Discount templates
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient, StationType, StationStatus, PricingModel, FoodCategory, DiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ArcadeOS database...");

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@arcadeos.local" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@arcadeos.local",
      passwordHash: adminPasswordHash,
      name: "Admin User",
      roleId: "role_admin",
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email} (password: admin1234)`);

  const receptionPasswordHash = await bcrypt.hash("reception123", 12);
  const receptionist = await prisma.user.upsert({
    where: { email: "reception@arcadeos.local" },
    update: { passwordHash: receptionPasswordHash },
    create: {
      email: "reception@arcadeos.local",
      passwordHash: receptionPasswordHash,
      name: "Front Desk",
      roleId: "role_receptionist",
      isActive: true,
    },
  });
  console.log(`  ✓ Receptionist: ${receptionist.email} (password: reception123)`);

  // ── Stations ───────────────────────────────────────────────────────────────
  const stationData = [
    { name: "PS5 — Station 01", type: StationType.PS5,  ratePerHour: 120, maxPlayers: 2 },
    { name: "PS5 — Station 02", type: StationType.PS5,  ratePerHour: 120, maxPlayers: 2 },
    { name: "PS5 — Station 03", type: StationType.PS5,  ratePerHour: 120, maxPlayers: 2 },
    { name: "PS4 — Station 01", type: StationType.PS4,  ratePerHour: 80,  maxPlayers: 2 },
    { name: "PS4 — Station 02", type: StationType.PS4,  ratePerHour: 80,  maxPlayers: 2 },
    { name: "PC Gaming — Rig 01", type: StationType.PC, ratePerHour: 60,  maxPlayers: 1 },
    { name: "PC Gaming — Rig 02", type: StationType.PC, ratePerHour: 60,  maxPlayers: 1 },
    { name: "PC Gaming — Rig 03", type: StationType.PC, ratePerHour: 60,  maxPlayers: 1 },
    { name: "Racing Simulator", type: StationType.RACING_SIMULATOR, ratePerHour: 150, maxPlayers: 1 },
    { name: "VR Arena",          type: StationType.VR,               ratePerHour: 200, maxPlayers: 1 },
  ];

  for (const s of stationData) {
    const station = await prisma.station.upsert({
      where: { name: s.name },
      update: {},
      create: {
        name: s.name,
        type: s.type,
        status: StationStatus.AVAILABLE,
        pricingModel: PricingModel.PER_HOUR,
        ratePerHour: s.ratePerHour,
        maxPlayers: s.maxPlayers,
        isActive: true,
      },
    });

    // Create pricing for each player count
    for (let i = 1; i <= s.maxPlayers; i++) {
      const rateMultiplier = i === 1 ? 1 : (i === 2 ? 1.8 : (i === 3 ? 2.5 : 3)); // Just for seeding sensible values
      await prisma.stationPricing.upsert({
        where: { stationId_playerCount: { stationId: station.id, playerCount: i } },
        update: {},
        create: {
          stationId: station.id,
          playerCount: i,
          ratePerHour: Math.round(s.ratePerHour * rateMultiplier),
          isActive: true,
        },
      });
    }
  }
  console.log(`  ✓ ${stationData.length} stations and pricings created`);

  // ── Food Items ─────────────────────────────────────────────────────────────
  const foodItems = [
    { name: "Nachos & Dip",   category: FoodCategory.SNACKS,         price: 120 },
    { name: "Burger",         category: FoodCategory.MEALS,          price: 180 },
    { name: "Pepsi (330ml)",  category: FoodCategory.BEVERAGES_COLD, price: 40  },
    { name: "Red Bull",       category: FoodCategory.BEVERAGES_COLD, price: 120 },
    { name: "Hot Coffee",     category: FoodCategory.BEVERAGES_HOT,  price: 60  },
    { name: "Combo Meal",     category: FoodCategory.COMBOS,         price: 250 },
  ];

  for (const item of foodItems) {
    await prisma.foodItem.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        category: item.category,
        price: item.price,
        isAvailable: true,
      },
    });
  }
  console.log(`  ✓ ${foodItems.length} food items created`);

  // ── Discounts ──────────────────────────────────────────────────────────────
  const discounts = [
    { name: "Student Discount", code: "STUDENT10", type: DiscountType.PERCENTAGE,   value: 10 },
    { name: "Weekend Special",  code: "WEEKEND20", type: DiscountType.PERCENTAGE,   value: 20, maxAmount: 100 },
    { name: "Flat ₹50 Off",     code: "FLAT50",    type: DiscountType.FIXED_AMOUNT, value: 50, minBillAmount: 200 },
  ];

  for (const d of discounts) {
    await prisma.discount.upsert({
      where: { code: d.code },
      update: {},
      create: {
        name: d.name,
        code: d.code,
        type: d.type,
        value: d.value,
        maxAmount: "maxAmount" in d ? d.maxAmount : undefined,
        minBillAmount: "minBillAmount" in d ? d.minBillAmount : undefined,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${discounts.length} discounts created`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
