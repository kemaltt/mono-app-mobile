import prisma from "./prisma";

export const AI_LIMITS = {
  TRIAL: 10,
  PRO: 100,
  ULTIMATE: 1000000, // Practically unlimited
};

export async function checkAndIncrementAiUsage(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  trialExpired?: boolean;
  limitReached?: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      licenseTier: true,
      aiUsageCount: true,
      aiUsageResetAt: true,
      trialEndsAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  // Check trial expiration
  if (user.licenseTier === "TRIAL" && user.trialEndsAt) {
    if (now > new Date(user.trialEndsAt)) {
      return { allowed: false, remaining: 0, trialExpired: true };
    }
  }

  const resetAt = new Date(user.aiUsageResetAt);
  const limit = AI_LIMITS[user.licenseTier as keyof typeof AI_LIMITS] || 10;

  // Check if we need to reset the count (daily limit)
  const isNewDay =
    now.getUTCDate() !== resetAt.getUTCDate() ||
    now.getUTCMonth() !== resetAt.getUTCMonth() ||
    now.getUTCFullYear() !== resetAt.getUTCFullYear();

  if (isNewDay) {
    // Reset count for a new day
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiUsageCount: 1,
        aiUsageResetAt: now,
      },
    });
    return { allowed: true, remaining: limit - 1 };
  }

  // Check if limit is reached
  if (user.aiUsageCount >= limit) {
    return { allowed: false, remaining: 0, limitReached: true };
  }

  // Increment count
  await prisma.user.update({
    where: { id: userId },
    data: {
      aiUsageCount: {
        increment: 1,
      },
    },
  });

  return { allowed: true, remaining: limit - (user.aiUsageCount + 1) };
}
