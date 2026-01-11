import { Hono } from "hono";
import { jwt } from "hono/jwt";
import prisma from "../lib/prisma";

const membership = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeyshouldbehidden";

membership.use("/*", jwt({ secret: JWT_SECRET }));

// GET Current Status
membership.get("/status", async (c) => {
  const payload = c.get("jwtPayload");
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      licenseTier: true,
      trialEndsAt: true,
      aiUsageCount: true,
      aiUsageResetAt: true,
    },
  });

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

// UPGRADE Tier (Simulated for Demo)
membership.post("/upgrade", async (c) => {
  const payload = c.get("jwtPayload");
  const { tier } = await c.req.json();

  if (!["PRO", "ULTIMATE"].includes(tier)) {
    return c.json({ error: "Invalid tier selection" }, 400);
  }

  try {
    const user = await prisma.user.update({
      where: { id: payload.id },
      data: {
        licenseTier: tier,
        // If they upgrade, we clear trialEndsAt (or keep it if it's informational)
        trialEndsAt: null,
      },
    });

    return c.json({
      message: `Successfully upgraded to ${tier}!`,
      user: {
        licenseTier: user.licenseTier,
        aiUsageCount: user.aiUsageCount,
      },
    });
  } catch (error) {
    return c.json({ error: "Upgrade failed" }, 500);
  }
});

export default membership;
