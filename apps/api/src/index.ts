import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import auth from "./routes/auth";
import transactions from "./routes/transactions";
import profile from "./routes/profile";
import budgets from "./routes/budgets";
import subscriptions from "./routes/subscriptions";
import debts from "./routes/debts";
import membership from "./routes/membership";
import admin from "./routes/admin";
import notifications from "./routes/notifications";

const app = new Hono();

// app.use("*", logger());
// app.use("*", cors());

app.use("/uploads/*", serveStatic({ root: "./" }));

app.get("/", (c) => {
  return c.text("Mono API is running!");
});

app.route("/auth", auth);
app.route("/transactions", transactions);
app.route("/profile", profile);
app.route("/budgets", budgets);
app.route("/subscriptions", subscriptions);
app.route("/debts", debts);
app.route("/membership", membership);
app.route("/admin", admin);
app.route("/notifications", notifications);

import { handle } from "hono/vercel";

// ... (existing imports)

// ... (existing app setup)

const port = 4040;

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0",
  });
}

export default app;
