import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Passwords
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const cashierPassword = await bcrypt.hash("Cashier@123", 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: {
      email: "admin@abmart.lk",
    },
    update: {
      name: "AB Mart Admin",
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      name: "AB Mart Admin",
      email: "admin@abmart.lk",
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Create Cashier
  const cashier = await prisma.user.upsert({
    where: {
      email: "cashier@abmart.lk",
    },
    update: {
      name: "AB Mart Cashier",
      password: cashierPassword,
      role: Role.CASHIER,
      isActive: true,
    },
    create: {
      name: "AB Mart Cashier",
      email: "cashier@abmart.lk",
      password: cashierPassword,
      role: Role.CASHIER,
      isActive: true,
    },
  });

  console.log("✅ Admin created:", admin.email);
  console.log("✅ Cashier created:", cashier.email);

  console.log("🌱 Database seed completed!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });