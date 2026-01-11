import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { verify } from "hono/jwt";
import prisma from "../lib/prisma";
import { addXP } from "../lib/gamification";
import { trialGuard } from "../middleware/trial-check";

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

app.use("/*", trialGuard);

const createBudgetSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
  category: z.string(),
  color: z.string().optional(),
});

// GET / - List budgets with spent calculation (Monthly default)
app.get("/", async (c) => {
  const user = c.get("user");
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all expense aggregations by category in one go
    const aggregations = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: firstDayOfMonth },
      },
      _sum: { amount: true },
    });

    const spentMap = aggregations.reduce((acc, curr) => {
      acc[curr.category] = Number(curr._sum.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const budgetsWithSpent = budgets.map((b) => ({
      ...b,
      spent: spentMap[b.category] || 0,
    }));

    return c.json({ budgets: budgetsWithSpent });
  } catch (e) {
    console.error(e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// POST / - Create Budget
app.post("/", zValidator("json", createBudgetSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  try {
    // Check if budget for this category already exists
    const existing = await prisma.budget.findFirst({
      where: { userId: user.id, category: body.category },
    });

    if (existing) {
      return c.json({ error: "Budget for this category already exists" }, 400);
    }

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        name: body.name,
        amount: body.amount,
        category: body.category,
        color: body.color,
        period: "MONTHLY",
      },
    });

    // Award XP for creating a budget
    const reward = await addXP(user.id, 15);

    return c.json({ ...budget, ...reward }, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Failed to create budget" }, 500);
  }
});

// DELETE /:id
app.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  try {
    await prisma.budget.deleteMany({
      where: { id: id, userId: user.id },
    });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: "Failed to delete" }, 500);
  }
});

export default app;
