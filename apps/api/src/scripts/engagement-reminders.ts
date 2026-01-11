import prisma from "../lib/prisma";
import { sendPushNotification } from "../lib/notifications";

async function runEngagementReminders() {
  console.log("Running Engagement Reminders CRON...");
  const now = new Date();

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(now.getDate() - 3);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  // 1. Inactivity Reminder (3 days no login)
  const inactiveUsers = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      pushToken: { not: null },
      lastLoginAt: { lte: threeDaysAgo },
    },
  });

  for (const user of inactiveUsers) {
    console.log(`Sending 'Miss you' notification to ${user.email}`);
    await sendPushNotification(
      user.id,
      "Wir vermissen dich! 🤗",
      "Du warst seit 3 Tagen nicht mehr hier. Wie wäre es, wenn du deine Ausgaben überprüfst?",
      { screen: "Dashboard" }
    );
  }

  // 2. Transaction Reminder (7 days no transaction)
  const nonTransactingUsers = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      pushToken: { not: null },
      lastTransactionAt: { lte: sevenDaysAgo },
    },
  });

  for (const user of nonTransactingUsers) {
    // Avoid double notification if they are also in the inactive list
    const isAlreadyNotified = inactiveUsers.find((u) => u.id === user.id);
    if (isAlreadyNotified) continue;

    console.log(`Sending 'Transaction' reminder to ${user.email}`);
    await sendPushNotification(
      user.id,
      "Vergiss deine Ausgaben nicht! ✍️",
      "Du hast seit einer Woche keine Transaktion mehr eingegeben. Vergiss nicht, deine Einnahmen und Ausgaben zu kontrollieren!",
      { screen: "AddTransaction" }
    );
  }

  console.log("Engagement Reminders CRON finished.");
}

// If run directly
if (require.main === module) {
  runEngagementReminders()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runEngagementReminders };
