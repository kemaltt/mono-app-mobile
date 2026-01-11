import { Context, Next } from "hono";

export const adminGuard = async (c: Context, next: Next) => {
  const payload = c.get("jwtPayload");
  const role = (payload as any)?.role;

  if (!payload || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return c.json({ error: "Unauthorized: Admin access required" }, 403);
  }

  await next();
};

export const superAdminGuard = async (c: Context, next: Next) => {
  const payload = c.get("jwtPayload");
  const role = (payload as any)?.role;

  if (!payload || role !== "SUPER_ADMIN") {
    return c.json({ error: "Unauthorized: Super Admin access required" }, 403);
  }

  await next();
};
