import { Context, Next } from "hono";

export const adminGuard = async (c: Context, next: Next) => {
  const payload = c.get("jwtPayload");

  if (!payload || (payload as any).role !== "ADMIN") {
    return c.json({ error: "Unauthorized: Admin access required" }, 403);
  }

  await next();
};
