import { PrismaClient } from "@prisma/client";
import { addXP, checkAchievements } from "../lib/gamification";

const prisma = new PrismaClient();

async function runTest() {
  console.log("🚀 Starting Gamification Logic Test...");

  // 1. Find a test user or create one
  let user = await prisma.user.findFirst({
    where: { email: { contains: "test" } },
  });

  if (!user) {
    console.log("Creating a new test user...");
    user = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@example.com`,
        password: "hashed_password",
        firstName: "Tester",
        xp: 0,
        level: 1,
      },
    });
  }

  console.log(
    `👤 Using User: ${user.email} (Current XP: ${user.xp}, Level: ${user.level})`
  );

  // 2. Test XP Gain
  console.log("\n--- Testing XP Gain ---");
  const xpResult = await addXP(user.id, 15);
  console.log("Result:", xpResult);

  if (xpResult.xp > 0) {
    console.log("✅ XP added successfully.");
  } else {
    console.log("❌ XP gain failed.");
  }

  // 3. Test Achievement Unlocking
  console.log("\n--- Testing Achievement Unlocking ---");

  // Create the "first_tx" achievement if it doesn't exist
  await prisma.achievement.upsert({
    where: { key: "first_tx" },
    update: {},
    create: {
      key: "first_tx",
      name: "First Step",
      description: "Create your first transaction",
      icon: "star",
      xpReward: 50,
    },
  });

  // Simulate a transaction count for the user
  // Let's ensure there's at least one transaction
  let wallet = await prisma.wallet.findFirst({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        name: "Test Wallet",
        balance: 100,
      },
    });
  }

  await prisma.transaction.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      amount: 10,
      type: "EXPENSE",
      category: "Food",
      description: "Test Transaction",
    },
  });

  const achievements = await checkAchievements(user.id);
  console.log("Unlocked Achievements:", achievements);

  if (achievements.length > 0) {
    console.log("✅ Achievement system working.");
  } else {
    // Maybe it was already unlocked? Check DB
    const count = await prisma.userAchievement.count({
      where: { userId: user.id },
    });
    if (count > 0) {
      console.log("ℹ️ Achievements already exists for this user (working).");
    } else {
      console.log("❌ No achievements unlocked.");
    }
  }

  console.log("\n🏁 Test Finished.");
}

runTest()
  .catch((e) => console.error("❌ Test Error:", e))
  .finally(async () => await prisma.$disconnect());
