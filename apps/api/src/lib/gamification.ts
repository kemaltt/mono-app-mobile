import prisma from "./prisma";

export const addXP = async (
  userId: string,
  amount: number,
  shouldCheckAchievements = true
) => {
  try {
    const dbUser: any = await prisma.user.findUnique({
      where: { id: userId }, // Changed from user.id to userId to maintain syntactic correctness
      select: { xp: true, level: true }, // Kept original select to maintain logical correctness for XP calculation
    });

    if (!dbUser) return { xp: 0, level: 1, unlockedAchievements: [] }; // Changed 'user' to 'dbUser'

    const newXP = dbUser.xp + amount; // Changed 'user' to 'dbUser'
    const newLevel = Math.floor(newXP / 100) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        level: newLevel,
      } as any,
    });

    let unlockedAchievements: any[] = [];
    if (shouldCheckAchievements) {
      unlockedAchievements = await checkAchievements(userId);
    }

    return { xp: newXP, level: newLevel, unlockedAchievements };
  } catch (error) {
    console.error("XP Gain Error:", error);
    return { xp: 0, level: 1, unlockedAchievements: [] };
  }
};

export const checkAchievements = async (userId: string) => {
  const newlyUnlocked: any[] = [];
  try {
    const txCount = await prisma.transaction.count({ where: { userId } });

    if (txCount >= 1) {
      const ach = await unlockAchievement(userId, "first_tx");
      if (ach) newlyUnlocked.push(ach);
    }
    if (txCount >= 10) {
      const ach = await unlockAchievement(userId, "tx_master");
      if (ach) newlyUnlocked.push(ach);
    }

    const budgetCount = await prisma.budget.count({ where: { userId } });
    if (budgetCount >= 3) {
      const ach = await unlockAchievement(userId, "budget_planner");
      if (ach) newlyUnlocked.push(ach);
    }

    // Check for AI scans (transactions that were scanning via AI often have attachmentUrl but we can also check if any scan happened)
    // For now, we manually trigger ai_scanner in the /scan route to be 100% accurate.
    return newlyUnlocked;
  } catch (e) {
    console.error("Achievement check error:", e);
    return [];
  }
};

export const unlockAchievement = async (userId: string, key: string) => {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { key: key },
    });
    if (!achievement) return null;

    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: userId,
          achievementId: achievement.id,
        },
      },
    });

    if (!existing) {
      const unlocked = await prisma.userAchievement.create({
        data: {
          userId: userId,
          achievementId: achievement.id,
        },
        include: { achievement: true },
      });

      // Award extra XP for achievement without re-checking (recursion fix)
      await addXP(userId, achievement.xpReward, false);
      return unlocked.achievement;
    }
    return null;
  } catch (error) {
    console.error("Unlock Error:", error);
    return null;
  }
};
