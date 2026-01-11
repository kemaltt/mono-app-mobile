import { Context, Next } from "hono";
import { isTrialExpired } from "../lib/trial";

export const trialGuard = async (c: Context, next: Next) => {
  const user = c.get("user");
  const method = c.req.method;

  // We only block mutations (POST, PUT, PATCH, DELETE)
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Skip if it's not a mutation
  if (!isMutation) {
    return await next();
  }

  // Skip auth and membership related routes if necessary
  // But usually this middleware is applied to specific route groups

  if (user && user.id) {
    const expired = await isTrialExpired(user.id);
    if (expired) {
      return c.json(
        {
          error: "Trial Expired",
          trialExpired: true,
          message:
            "Your 30-day trial has ended. Please upgrade to PRO or ULTIMATE to continue using these features.",
        },
        403
      );
    }
  }

  await next();
};
