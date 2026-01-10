import prisma from "./prisma";

export const addXP = async (userId: string, amount: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (!user) return;

    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 100) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });

    // Handle Achievements check here later
    await checkAchievements(userId);

    return { xp: newXP, level: newLevel };
  } catch (error) {
    console.error("XP Gain Error:", error);
  }
};

export const checkAchievements = async (userId: string) => {
  // Simple check for now
  try {
    const txCount = await prisma.transaction.count({ where: { userId } });

    if (txCount >= 1) {
      await unlockAchievement(userId, "first_tx");
    }
    if (txCount >= 10) {
      await unlockAchievement(userId, "tx_master");
    }

    const budgetCount = await prisma.budget.count({ where: { userId } });
    if (budgetCount >= 3) {
      await unlockAchievement(userId, "budget_planner");
    }
  } catch (e) {
    console.error("Achievement check error:", e);
  }
};

export const unlockAchievement = async (userId: string, key: string) => {
  try {
    const achievement = await prisma.achievement.findUnique({ where: { key } });
    if (!achievement) return;

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (!existing) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });
      // Award extra XP for achievement
      await addXP(userId, achievement.xpReward);
    }
  } catch (error) {
    // Already unlocked or other error
  }
};
