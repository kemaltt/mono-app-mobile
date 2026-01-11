import prisma from "./prisma";

export async function isTrialExpired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      licenseTier: true,
      trialEndsAt: true,
    },
  });

  if (!user) return false;

  if (user.licenseTier === "TRIAL" && user.trialEndsAt) {
    if (new Date() > new Date(user.trialEndsAt)) {
      return true;
    }
  }

  return false;
}

export async function checkTrialStatus(userId: string): Promise<{
  isExpired: boolean;
  licenseTier: string;
  daysLeft: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      licenseTier: true,
      trialEndsAt: true,
    },
  });

  if (!user) {
    return { isExpired: false, licenseTier: "FREE", daysLeft: 0 };
  }

  if (user.licenseTier !== "TRIAL") {
    return { isExpired: false, licenseTier: user.licenseTier, daysLeft: 0 };
  }

  const now = new Date();
  const endsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : now;
  const isExpired = now > endsAt;

  const diffTime = endsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isExpired,
    licenseTier: user.licenseTier,
    daysLeft: Math.max(0, diffDays),
  };
}
