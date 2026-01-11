import { Hono } from "hono";
import { verify } from "hono/jwt";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeyshouldbehidden";

type Variables = {
  user: {
    id: string;
    email: string;
  };
};

const app = new Hono<{ Variables: Variables }>();

app.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
  const token = authHeader.split(" ")[1];
  try {
    const payload = await verify(token, JWT_SECRET);
    c.set("user", payload as any);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

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
    console.error(error);
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
            date: new Date(),
          },
        });
        createdTransactions.push(tx);

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
