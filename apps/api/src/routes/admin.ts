import { Hono } from "hono";
import { jwt } from "hono/jwt";
import prisma from "../lib/prisma";
import { adminGuard } from "../middleware/admin-check";

const admin = new Hono();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret";

// Protect all admin routes
admin.use("/*", jwt({ secret: JWT_SECRET }));
admin.use("/*", adminGuard);

// Get general stats
admin.get("/stats", async (c) => {
  const totalUsers = await prisma.user.count();
  const proUsers = await prisma.user.count({
    where: { licenseTier: "PRO" },
  } as any);
  const trialUsers = await prisma.user.count({
    where: { licenseTier: "TRIAL" },
  } as any);

  const ultimateUsers = await prisma.user.count({
    where: { licenseTier: "ULTIMATE" },
  } as any);

  // Recent 10 scannings could be fetched if there was a separate Scan model,
  // since scans are inside Transaction, we'll just count transactions with attachment
  const totalScans = await prisma.transaction.count({
    where: { attachmentUrl: { not: null } },
  });

  return c.json({
    totalUsers,
    proUsers,
    trialUsers,
    ultimateUsers,
    totalScans,
  });
});

// List users with filtering and simple pagination
admin.get("/users", async (c) => {
  const queryLicense = c.req.query("licenseTier");
  const queryStatus = c.req.query("status");

  const where: any = {};
  if (queryLicense) where.licenseTier = queryLicense;
  if (queryStatus) where.status = queryStatus;

  const users = await (prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      licenseTier: true,
      trialEndsAt: true,
      role: true,
      createdAt: true,
      isVerified: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  } as any) as Promise<any[]>);

  return c.json(users);
});

// Get user detail
admin.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await (prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      licenseTier: true,
      trialEndsAt: true,
      role: true,
      createdAt: true,
      isVerified: true,
      status: true,
      aiUsageCount: true,
      aiUsageResetAt: true,
      timezone: true,
      xp: true,
      level: true,
    },
  } as any) as Promise<any>);

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

// Update user details
admin.patch("/users/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const data: any = {};
  if (body.licenseTier) data.licenseTier = body.licenseTier;
  if (body.role) data.role = body.role;
  if (body.status) data.status = body.status;
  if (body.isVerified !== undefined) data.isVerified = body.isVerified;
  if (body.aiUsageCount !== undefined)
    data.aiUsageCount = parseInt(body.aiUsageCount);
  if (body.trialEndsAt) data.trialEndsAt = new Date(body.trialEndsAt);
  if (body.trialEndsAt === null) data.trialEndsAt = null;

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
  });

  return c.json(updatedUser);
});

export default admin;
