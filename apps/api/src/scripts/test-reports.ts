import prisma from "../lib/prisma";
import { sendWeeklySummary } from "../lib/reports";

async function test() {
  const email = "masaloungee@gmail.com";
  console.log(`Testing weekly report for ${email}...`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("User not found");
    return;
  }

  // Ensure there are some transactions in the last week
  const wallet = await prisma.wallet.findFirst({ where: { userId: user.id } });
  if (wallet) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        amount: 50,
        type: "EXPENSE",
        category: "Market",
        date: new Date(),
      },
    });
    await prisma.transaction.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        amount: 200,
        type: "INCOME",
        category: "Maaş",
        date: new Date(),
      },
    });
  }

  await sendWeeklySummary(user.id);

  console.log("Test completed.");
}

test().catch(console.error);
