import prisma from "./prisma";
import { sendPushNotification } from "./notifications";
import { format } from "date-fns";

/**
 * Generates and sends a weekly financial summary report to a user.
 */
export async function sendWeeklySummary(userId: string) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch transactions for the last 7 days
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
    });

    if (transactions.length === 0) {
      // Maybe send a "quiet week" notification?
      return;
    }

    // 2. Aggregate stats
    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // 3. Find top category
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + Number(t.amount);
      });

    const topCategory = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // 4. Construct message
    const title = "Haftalık Finansal Özetin Hazır! 📈";
    let body = `Bu hafta toplamda $${totalExpense.toFixed(
      2
    )} harcadın ve $${totalIncome.toFixed(2)} kazandın.`;

    if (topCategory) {
      body += ` En çok harcamayı "${
        topCategory[0]
      }" kategorisinde yaptın ($${topCategory[1].toFixed(2)}).`;
    }

    // 5. Send Notification
    await sendPushNotification(userId, title, body, {
      type: "weekly_summary",
      totalExpense,
      totalIncome,
      topCategory: topCategory ? topCategory[0] : null,
    });

    console.log(`Weekly summary sent to user ${userId}`);
  } catch (error) {
    console.error(`Failed to send weekly summary to user ${userId}:`, error);
  }
}

/**
 * Runs weekly summary for all users who have a push token.
 */
export async function runBulkWeeklyReports() {
  const users = await prisma.user.findMany({
    where: {
      pushToken: { not: null },
    },
    select: { id: true },
  });

  console.log(`Starting bulk weekly reports for ${users.length} users...`);

  for (const user of users) {
    await sendWeeklySummary(user.id);
  }

  console.log("Bulk weekly reports completed.");
}
