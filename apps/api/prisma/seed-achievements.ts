import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const achievements = [
    {
      key: "first_tx",
      name: "First Step",
      description: "Created your first transaction",
      icon: "rocket",
      xpReward: 50,
    },
    {
      key: "tx_master",
      name: "Transaction Master",
      description: "Created 10 transactions",
      icon: "trophy",
      xpReward: 100,
    },
    {
      key: "budget_planner",
      name: "Budget Hero",
      description: "Created 3 different budgets",
      icon: "shield-star",
      xpReward: 150,
    },
    {
      key: "ai_scanner",
      name: "AI Visionary",
      description: "Scanned your first receipt with Gemini AI",
      icon: "eye",
      xpReward: 75,
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: ach,
      create: ach,
    });
  }

  console.log("Achievements seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
