import prisma from "./prisma";
import { sendPushNotification } from "./notifications";

/**
 * Checks if a transaction exceeds budget thresholds (80% or 100%)
 * and triggers notifications if necessary.
 */
export async function checkBudgetThresholds(userId: string, category: string) {
  try {
    // 0. Check User Preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });
    const settings = (user?.notificationSettings as any) || {};
    if (settings.budget === false) return;

    // 1. Find active budget for this category
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        category: { equals: category, mode: "insensitive" },
      },
    });

    if (!budget) return;

    // ... (rest of the spending calculation remains same)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const expenseAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        category: category,
        type: "EXPENSE",
        date: { gte: firstDay },
      },
      _sum: { amount: true },
    });

    const totalSpent = Number(expenseAgg._sum.amount || 0);
    const budgetAmount = Number(budget.amount);
    const usageRatio = totalSpent / budgetAmount;

    // 3. Determine which alert to send
    let threshold: number | null = null;
    if (usageRatio >= 1.0) {
      threshold = 1.0;
    } else if (usageRatio >= 0.8) {
      threshold = 0.8;
    }

    if (!threshold) return;

    // 4. De-duplication check...
    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: firstDay },
      },
      take: 20,
    });

    const alreadySent = existingNotifications.some((n) => {
      const data = n.data as any;
      return (
        data?.type === "budget_threshold" &&
        data?.threshold === threshold &&
        data?.budgetId === budget.id
      );
    });

    if (alreadySent) return;

    // 5. Send Alert
    const isOver = threshold === 1.0;
    const title = isOver ? "Bütçe Aşıldı! ⚠️" : "Bütçe Sınırına Yaklaşıldı 📊";
    const body = isOver
      ? `${category} kategorisindeki bütçeni tamamen doldurdun.`
      : `${category} bütçenin %80'ine ulaştın. Dikkatli harcama zamanı!`;

    await sendPushNotification(userId, title, body, {
      type: "budget_threshold",
      threshold,
      budgetId: budget.id,
    });
  } catch (error) {
    console.error("Error in checkBudgetThresholds:", error);
  }
}

/**
 * Checks if a transaction is "large" and triggers a security alert.
 */
export async function checkLargeTransaction(
  userId: string,
  amount: number,
  category: string
) {
  try {
    // 0. Check User Preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });
    const settings = (user?.notificationSettings as any) || {};
    if (settings.security === false) return;

    const LARGE_THRESHOLD = 500;

    if (amount >= LARGE_THRESHOLD) {
      const title = "Yüksek Tutarlı Harcama! 🛡️";
      const body = `${amount} tutarında bir ${category} harcaması kaydedildi. Eğer bu sana ait değilse kontrol etmeni öneririz.`;

      await sendPushNotification(userId, title, body, {
        type: "large_transaction",
        amount,
      });
    }
  } catch (e) {
    console.error(e);
  }
}
