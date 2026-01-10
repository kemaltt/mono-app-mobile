import { Hono } from "hono";
import prisma from "../lib/prisma";

const app = new Hono<{ Variables: { user: any } }>();

// GET /debts - List all
app.get("/", async (c) => {
  const user = c.get("user");
  try {
    const debts = await prisma.debt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return c.json({ debts });
  } catch (error) {
    return c.json({ error: "Failed to fetch debts" }, 500);
  }
});

// POST /debts - Create new
app.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { personName, amount, type, dueDate, note } = body;

  try {
    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        personName,
        amount: parseFloat(amount),
        type, // 'BORROWED' or 'LENT'
        dueDate: dueDate ? new Date(dueDate) : null,
        note,
      },
    });
    return c.json(debt, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create debt" }, 500);
  }
});

// PATCH /debts/:id/resolve - Mark as resolved
app.patch("/:id/resolve", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const { isResolved } = body;

  try {
    const debt = await prisma.debt.updateMany({
      where: { id, userId: user.id },
      data: { isResolved },
    });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to update debt" }, 500);
  }
});

// DELETE /debts/:id - Delete
app.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  try {
    await prisma.debt.deleteMany({
      where: { id, userId: user.id },
    });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete debt" }, 500);
  }
});

export default app;
