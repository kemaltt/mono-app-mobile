import prisma from "../lib/prisma";
import { sendTrialReminderEmail } from "../lib/email";

async function runTrialReminders() {
  console.log("Running Trial Reminders CRON...");
  const now = new Date();

  // Find all trial users
  const trialUsers = await prisma.user.findMany({
    where: {
      licenseTier: "TRIAL",
      trialEndsAt: {
        not: null,
      },
    },
  });

  for (const user of trialUsers) {
    if (!user.trialEndsAt) continue;

    const endsAt = new Date(user.trialEndsAt);
    const diffTime = endsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(`User ${user.email} has ${diffDays} days left.`);

    // Send reminders at 7, 3, and 1 day remaining
    if ([7, 3, 1].includes(diffDays)) {
      try {
        await sendTrialReminderEmail(user.email, diffDays);
        console.log(`Sent ${diffDays}-day reminder to ${user.email}`);
      } catch (err) {
        console.error(`Failed to send reminder to ${user.email}:`, err);
      }
    }
  }

  console.log("Trial Reminders CRON finished.");
}

// If run directly
if (require.main === module) {
  runTrialReminders()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runTrialReminders };
