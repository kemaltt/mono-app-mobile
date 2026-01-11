import { PrismaClient } from "@prisma/client";
import { sendWeeklySummary } from "../lib/reports";
import { checkLargeTransaction } from "../lib/alerts";

const prisma = new PrismaClient();

async function testSettings() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found to test.");
    return;
  }

  console.log(`Testing with user: ${user.email}`);

  // 1. Disable Weekly Reports
  console.log("Setting weekly: false...");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationSettings: {
        budget: true,
        security: true,
        weekly: false,
        gamification: true,
      },
    },
  });

  console.log("Triggering weekly summary (should be skipped)...");
  await sendWeeklySummary(user.id);

  // 2. Disable Security Alerts
  console.log("Setting security: false...");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationSettings: {
        budget: true,
        security: false,
        weekly: true,
        gamification: true,
      },
    },
  });

  console.log("Triggering large transaction alert (should be skipped)...");
  await checkLargeTransaction(user.id, 1000, "Luxury");

  // 3. Enable All
  console.log("Enabling all...");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationSettings: {
        budget: true,
        security: true,
        weekly: true,
        gamification: true,
      },
    },
  });

  console.log("Triggering large transaction alert (should SEND now)...");
  await checkLargeTransaction(user.id, 1000, "Luxury");

  console.log("Test finished.");
}

testSettings().catch(console.error);
