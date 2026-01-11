import prisma from "../lib/prisma";
import { checkBudgetThresholds, checkLargeTransaction } from "../lib/alerts";

async function test() {
  const email = "masaloungee@gmail.com";
  console.log(`Testing alerts for ${email}...`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("User not found");
    return;
  }

  // 1. Test Large Transaction
  console.log("Testing large transaction alert...");
  await checkLargeTransaction(user.id, 600, "Shopping");

  // 2. Test Budget Alert
  // Create a dummy budget if not exists
  const category = "Food";
  let budget = await prisma.budget.findFirst({
    where: { userId: user.id, category },
  });

  if (!budget) {
    console.log(`Creating dummy ${category} budget...`);
    budget = await prisma.budget.create({
      data: {
        userId: user.id,
        name: "Test Food Budget",
        amount: 100,
        category,
      },
    });
  }

  console.log(
    `Testing ${category} budget threshold alert (current amount: ${budget.amount})...`
  );

  // Create a transaction that hits 80%+
  await prisma.transaction.create({
    data: {
      userId: user.id,
      walletId:
        (await prisma.wallet.findFirst({ where: { userId: user.id } }))?.id ||
        "",
      amount: 85,
      type: "EXPENSE",
      category,
      date: new Date(),
    },
  });

  await checkBudgetThresholds(user.id, category);

  console.log("Test completed. Check logs and DB notifications.");
}

test().catch(console.error);
