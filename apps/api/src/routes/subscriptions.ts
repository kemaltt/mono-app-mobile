import { Hono } from "hono";
import prisma from "../lib/prisma";

const app = new Hono<{ Variables: { user: any } }>();

// Helper to calculate next payment date
const calculateNextDate = (current: Date, cycle: string) => {
  const next = new Date(current);
  if (cycle === "WEEKLY") {
    next.setDate(next.getDate() + 7);
  } else if (cycle === "YEARLY") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    // Default MONTHLY
    next.setMonth(next.getMonth() + 1);
  }
  return next;
};

// GET /subscriptions - List all
app.get("/", async (c) => {
  const user = c.get("user");
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { nextPaymentDate: "asc" },
    });
    return c.json({ subscriptions: subs });
  } catch (error) {
    return c.json({ error: "Failed to fetch subscriptions" }, 500);
  }
});

// POST /subscriptions - Create new
app.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { name, amount, category, billingCycle, startDate, description } = body;

  try {
    const start = new Date(startDate);
    // If start date is in past, calculate next payment date from today or just set it to start date?
    // Logic: If I subscribed Netflix on 1st of month, and today is 15th, next payment is 1st of next month.
    // For simplicity, let's assume startDate is the "First Payment Date" or "Next Payment Date".
    // If user says "Started 3 years ago", calculating next date is complex.
    // Let's interpret 'startDate' as 'First billing date to track'.

    let nextPayment = new Date(start);
    const now = new Date();

    // If selected start date is in the past, move it forward until it's in future
    while (nextPayment < now) {
      nextPayment = calculateNextDate(nextPayment, billingCycle || "MONTHLY");
    }

    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        name,
        amount: parseFloat(amount),
        category,
        billingCycle: billingCycle || "MONTHLY",
        startDate: start,
        nextPaymentDate: nextPayment,
        description,
      },
    });

    return c.json(sub, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create subscription" }, 500);
  }
});

// DELETE /subscriptions/:id - Cancel
app.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  try {
    await prisma.subscription.updateMany({
      where: { id, userId: user.id },
      data: { status: "INACTIVE" }, // Soft delete/cancel
    });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete" }, 500);
  }
});

// POST /subscriptions/check - Manually trigger check for due subscriptions
// This should ideally be called on App Open
app.post("/check", async (c) => {
  const user = c.get("user");
  const now = new Date();

  try {
    const dueSubs = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        nextPaymentDate: { lte: now },
      },
    });

    const createdTransactions = [];

    for (const sub of dueSubs) {
      // Create Transaction
      const wallet = await prisma.wallet.findFirst({
        where: { userId: user.id },
      });
      if (wallet) {
        const tx = await prisma.transaction.create({
          data: {
            userId: user.id,
            walletId: wallet.id,
            amount: sub.amount,
            type: "EXPENSE",
            category: sub.category,
            description: `Renewal: ${sub.name}`,
            date: new Date(), // Today
          },
        });
        createdTransactions.push(tx);

        // Update next payment date
        const nextDate = calculateNextDate(
          sub.nextPaymentDate,
          sub.billingCycle
        );
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextPaymentDate: nextDate },
        });
      }
    }

    return c.json({
      processed: dueSubs.length,
      transactions: createdTransactions,
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Check failed" }, 500);
  }
});

export default app;
