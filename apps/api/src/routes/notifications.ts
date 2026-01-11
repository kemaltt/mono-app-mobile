import { Hono } from "hono";
import { jwt } from "hono/jwt";
import prisma from "../lib/prisma";

const notifications = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeyshouldbehidden";

// Middleware to protect routes
notifications.use("/*", jwt({ secret: JWT_SECRET }));

// GET / - List notification history
notifications.get("/", async (c) => {
  const payload = c.get("jwtPayload");

  try {
    const history = await prisma.notification.findMany({
      where: { userId: payload.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: payload.id, isRead: false },
    });

    return c.json({ notifications: history, unreadCount });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch notifications" }, 500);
  }
});

// PATCH /read-all - Mark all as read
notifications.patch("/read-all", async (c) => {
  const payload = c.get("jwtPayload");

  try {
    await prisma.notification.updateMany({
      where: { userId: payload.id, isRead: false },
      data: { isRead: true },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to mark notifications as read" }, 500);
  }
});

// PATCH /:id/read - Mark single as read
notifications.patch("/:id/read", async (c) => {
  const payload = c.get("jwtPayload");
  const id = c.req.param("id");

  try {
    await prisma.notification.update({
      where: { id, userId: payload.id },
      data: { isRead: true },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

export default notifications;
