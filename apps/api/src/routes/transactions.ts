// @ts-nocheck
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { verify } from "hono/jwt";
import prisma from "../lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addXP, unlockAchievement } from "../lib/gamification";
import { checkAndIncrementAiUsage } from "../lib/ai-limit";
import { trialGuard } from "../middleware/trial-check";
import { checkBudgetThresholds, checkLargeTransaction } from "../lib/alerts";

const JWT_SECRET = process.env.JWT_SECRET;

type Variables = {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

const app = new Hono<{ Variables: Variables }>();

// Middleware to get user from token
app.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = await verify(token, JWT_SECRET!);
    c.set("user", payload as any);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Enforce trial limits on mutations
app.use("/*", trialGuard);

// Schema for creating transaction
const createTransactionSchema = z.object({
  walletId: z.string().optional(), // If not provided, use default wallet
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string(),
  description: z.string().optional(),
  date: z.string().optional(), // ISO String
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional(),
});

// UPLOAD ATTACHMENT
app.post("/upload", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();
  const file = body["file"] as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  try {
    const fs = require("fs/promises");
    const path = require("path");
    const { randomUUID } = require("crypto");

    const ext = path.extname(file.name).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".gif"].includes(ext);
    const isPdf = ext === ".pdf";

    if (!isImage && !isPdf) {
      return c.json(
        { error: "Invalid file type. Only images and PDFs are allowed." },
        400
      );
    }

    const fileName = `${randomUUID()}${ext}`;
    const userId = user.id;
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      userId,
      "transactions"
    );
    const filePath = path.join(uploadDir, fileName);

    // Ensure user-specific transactions directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const host = c.req.header("host");
    const isLocal =
      host?.includes("localhost") ||
      host?.includes("192.168.") ||
      host?.includes("127.0.0.1");
    const protocol = isLocal ? "http" : "https";
    const attachmentUrl = `${protocol}://${host}/uploads/${userId}/transactions/${fileName}`;
    const attachmentType = isPdf ? "PDF" : "IMAGE";

    return c.json({ attachmentUrl, attachmentType });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload attachment" }, 500);
  }
});

// SCAN RECEIPT WITH AI (GEMINI)
app.post("/scan", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  const lang = c.req.query("lang") || "en";

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const usageCheck = await checkAndIncrementAiUsage(user.id);
  if (!usageCheck.allowed) {
    return c.json(
      {
        error: usageCheck.trialExpired
          ? "Trial expired"
          : "Daily AI usage limit reached!",
        limitReached: usageCheck.limitReached,
        trialExpired: usageCheck.trialExpired,
        message: usageCheck.trialExpired
          ? "Your trial has ended. Please upgrade to continue."
          : "You have reached your daily AI limit. Please upgrade your membership for unlimited usage.",
      },
      403
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "Gemini API Key is not configured on server" }, 500);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `You are an expert financial and visual assistant. Analyze this image or PDF. 
        If the image is a receipt or bill, extract the transaction details. 
        If it is a general object (e.g., a chair, a plant, a car, etc.), identify what it is and describe it logically.

        Return ONLY a JSON object with this exact structure:
        {
          "amount": number,
          "category": "Food" | "Market" | "Transport" | "Shopping" | "Subscriptions" | "Health" | "Entertainment" | "Others",
          "description": "string",
          "date": "YYYY-MM-DD"
        }

        Instructions:
        1. "amount": For receipts, find the FINAL TOTAL. For general objects without a visible price, use 0.
        2. "category": Choose the most appropriate English key from the list above based on the item identified (e.g., Chair -> "Shopping", Car -> "Transport", Sandwich -> "Food").
        3. "description": Provide a short, professional summary or merchant name in ${lang} language. If it's an object, describe it (e.g., "Mavi bir sandalye", "Kırmızı bir araba").
        4. "date": Extract the transaction date. Use current date (${
          new Date().toISOString().split("T")[0]
        }) if not found.
        5. Tone: Ensure the "description" is professional and localized for ${lang}.
        6. NO markdown, NO code blocks, NO extra text. Just the JSON.`;

    // const prompt = `You are an expert financial assistant. Analyze this receipt image or PDF and extract the transaction details.

    //     Return ONLY a JSON object with this exact structure:
    //     {
    //       "amount": number,
    //       "category": "Food" | "Market" | "Transport" | "Shopping" | "Subscriptions" | "Health" | "Entertainment" | "Others",
    //       "description": "string",
    //       "date": "YYYY-MM-DD"
    //     }

    //     Instructions:
    //     1. "amount": Find the FINAL TOTAL amount. Ignore tax breakdowns or sub-totals.
    //     2. "category": Choose the most appropriate English key from the list above.
    //     3. "description": Provide a short summary or merchant name in ${lang} language.
    //     4. "date": Extract the transaction date. Use current date (${
    //       new Date().toISOString().split("T")[0]
    //     }) if not found.
    //     5. Tone: Ensure the "description" is professional and localized for ${lang}.
    //     6. NO markdown, NO code blocks, NO extra text. Just the JSON.`;

    // const prompt = `Analyze this receipt and extract the following information in JSON format:
    // - amount (numeric value only)
    // - category (choose one: Food, Market, Transport, Shopping, Subscriptions, Health, Entertainment, Others)
    // - description (short name of the store or item)
    // - date (ISO format if found, otherwise current date)

    // Only return the JSON object, nothing else.`
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean the response in case Gemini adds markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const data = JSON.parse(jsonStr);

    // Award XP for scanning
    const reward = await addXP(user.id, 25);
    const achievementAward = await unlockAchievement(user.id, "ai_scanner");

    const unlockedAchievements = [...(reward?.unlockedAchievements || [])];
    if (achievementAward) unlockedAchievements.push(achievementAward);

    return c.json({ ...data, ...reward, unlockedAchievements });
  } catch (error) {
    console.error("Scan error:", error);
    return c.json({ error: "Failed to scan receipt with AI" }, 500);
  }
});

// GET /dashboard - Summary stats
app.get("/dashboard", async (c) => {
  const user = c.get("user");

  try {
    // Get main wallet (simplification for now)
    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.id },
    });

    if (!wallet) {
      return c.json({ error: "Wallet not found" }, 404);
    }

    // Calculate total income and expense for this month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const incomeAgg = await prisma.transaction.aggregate({
      where: {
        walletId: wallet.id,
        type: "INCOME",
        date: { gte: firstDay },
      },
      _sum: { amount: true },
    });

    const expenseAgg = await prisma.transaction.aggregate({
      where: {
        walletId: wallet.id,
        type: "EXPENSE",
        date: { gte: firstDay },
      },
      _sum: { amount: true },
    });

    return c.json({
      balance: wallet.balance,
      income: incomeAgg._sum.amount || 0,
      expense: expenseAgg._sum.amount || 0,
      currency: wallet.currency,
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal error" }, 500);
  }
});

// GET / - List transactions
app.get("/", async (c) => {
  const user = c.get("user");
  const limit = Number(c.req.query("limit")) || 10;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { user: { id: user.id } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return c.json({ transactions });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal" }, 500);
  }
});

// GET /stats - Aggregated stats for charts
app.get("/stats", async (c) => {
  const user = c.get("user");
  const type = c.req.query("type")?.toUpperCase() || "EXPENSE";

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: type as any,
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: "asc" },
    });

    const monthlyData: Record<string, number> = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyData[monthNames[d.getMonth()]] = 0;
    }

    transactions.forEach((t) => {
      const m = monthNames[new Date(t.date).getMonth()];
      if (monthlyData[m] !== undefined) {
        monthlyData[m] += Number(t.amount);
      }
    });

    const chartData = Object.entries(monthlyData).map(([label, value]) => ({
      label,
      value,
    }));

    return c.json({ chartData });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal error" }, 500);
  }
});

// GET /stats/categories - Breakdown by category
app.get("/stats/categories", async (c) => {
  const user = c.get("user");
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const categories = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: { gte: firstDayOfMonth },
      },
      _sum: { amount: true },
    });

    const formattedData = categories.map((cat) => ({
      category: cat.category,
      amount: Number(cat._sum.amount || 0),
    }));

    return c.json({ categories: formattedData });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch category stats" }, 500);
  }
});

// GET /stats/ai-summary - AI personalized insights (with Cache)
app.get("/stats/ai-summary", async (c) => {
  const user = c.get("user");
  const lang = c.req.query("lang") || "en";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return c.json({ error: "AI not configured" }, 500);

  try {
    // 1. Check DB Cache
    const dbUser: any = await prisma.user.findUnique({
      where: { id: user.id },
      select: { aiSummary: true, aiSummaryAt: true, firstName: true } as any,
    });

    const now = new Date();
    const cacheThreshold = 24 * 60 * 60 * 1000; // 24 hours

    if (dbUser?.aiSummary && dbUser.aiSummaryAt) {
      const diff = now.getTime() - new Date(dbUser.aiSummaryAt).getTime();
      if (diff < cacheThreshold) {
        return c.json({ summary: dbUser.aiSummary, cached: true });
      }
    }

    // Cache missed or expired, check AI usage limit before calling Gemini
    const usageCheck = await checkAndIncrementAiUsage(user.id);
    if (!usageCheck.allowed) {
      return c.json(
        {
          error: usageCheck.trialExpired ? "Trial expired" : "AI Limit reached",
          limitReached: usageCheck.limitReached,
          trialExpired: usageCheck.trialExpired,
          message: usageCheck.trialExpired
            ? "Your trial has ended. Please upgrade."
            : "Daily limit reached.",
        },
        403
      );
    }

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: firstDayOfMonth },
      },
      select: {
        amount: true,
        type: true,
        category: true,
        description: true,
        date: true,
      },
    });

    if (transactions.length === 0) {
      return c.json({ summary: "No enough data for AI analysis yet." });
    }

    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const userName = dbUser?.firstName || "there";
    const prompt = `Analyze these transactions for ${userName} and provide a very short, friendly, and actionable financial insight in ${lang}.
    Transactions this month: ${JSON.stringify(transactions)}
    Total Income: ${totalIncome}
    Total Expense: ${totalExpense}
    
    Rules:
    - Keep it under 3 sentences.
    - Be motivating and helpful.
    - Use ${lang}.
    - NO markdown. Just plain text.`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      // Update Cache
      await prisma.user.update({
        where: { id: user.id },
        data: {
          aiSummary: summary,
          aiSummaryAt: now,
        } as any,
      });

      return c.json({ summary });
    } catch (aiError: any) {
      console.warn("Gemini API Error (Quota?):", aiError?.message);

      // Fallback to cache even if old if API fails
      if (dbUser?.aiSummary) {
        return c.json({ summary: dbUser.aiSummary, fallback: true });
      }

      if (aiError?.status === 429) {
        return c.json({
          summary:
            "AI is currently resting. Please try again later for your personalized insights!",
          isQuotaExceeded: true,
        });
      }

      throw aiError;
    }
  } catch (error: any) {
    console.error("AI Summary Route Error:", error.message);
    return c.json({ error: "AI summary failed", message: error.message }, 500);
  }
});

// GET /:id - Get single transaction
app.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!transaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    return c.json(transaction);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal error" }, 500);
  }
});

// POST / - Create Transaction
app.post("/", zValidator("json", createTransactionSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  try {
    // Find wallet
    let walletId = body.walletId;
    if (!walletId) {
      const w = await prisma.wallet.findFirst({ where: { userId: user.id } });
      if (!w) return c.json({ error: "No wallet" }, 404);
      walletId = w.id;
    }

    // Create transaction in transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          walletId: walletId!,
          amount: body.amount,
          type: body.type,
          category: body.category,
          description: body.description,
          date: body.date ? new Date(body.date) : new Date(),
          attachmentUrl: body.attachmentUrl,
          attachmentType: body.attachmentType,
        },
      });

      // Update wallet balance
      if (body.type === "INCOME") {
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: body.amount } },
        });
      } else {
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: body.amount } },
        });
      }

      return transaction;
    });

    // Update user's lastTransactionAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastTransactionAt: new Date() },
    });

    // Award XP for creating transaction
    const reward = await addXP(user.id, 10);

    // Fire & Forget: Trigger Smart Alerts
    if (body.type === "EXPENSE") {
      // We don't await these to keep the response fast
      checkBudgetThresholds(user.id, body.category).catch(console.error);
      checkLargeTransaction(user.id, body.amount, body.category).catch(
        console.error
      );
    }

    return c.json({ ...result, ...reward }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create transaction" }, 500);
  }
});

// PATCH /:id - Update Transaction
app.patch(
  "/:id",
  zValidator("json", createTransactionSchema.partial()),
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Get current transaction
        const oldT = await tx.transaction.findFirst({
          where: { id: id, userId: user.id },
        });

        if (!oldT) throw new Error("Transaction not found");

        // 2. Revert old balance effect
        if (oldT.type === "INCOME") {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { decrement: oldT.amount } },
          });
        } else {
          await tx.wallet.update({
            where: { id: oldT.walletId },
            data: { balance: { increment: oldT.amount } },
          });
        }

        // 3. Update transaction
        const updatedT = await tx.transaction.update({
          where: { id: id },
          data: {
            amount: body.amount,
            type: body.type,
            category: body.category,
            description: body.description,
            attachmentUrl: body.attachmentUrl,
            attachmentType: body.attachmentType,
            date: body.date ? new Date(body.date) : undefined,
          },
        });

        // 4. Apply new balance effect
        if (updatedT.type === "INCOME") {
          await tx.wallet.update({
            where: { id: updatedT.walletId },
            data: { balance: { increment: updatedT.amount } },
          });
        } else {
          await tx.wallet.update({
            where: { id: updatedT.walletId },
            data: { balance: { decrement: updatedT.amount } },
          });
        }

        return updatedT;
      });

      return c.json(result);
    } catch (error: any) {
      console.error(error);
      return c.json(
        { error: error?.message || "Failed to update transaction" },
        500
      );
    }
  }
);

// DELETE /:id - Remove Transaction
app.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Find transaction
      const t = await tx.transaction.findFirst({
        where: { id: id, userId: user.id },
      });

      if (!t) throw new Error("Transaction not found");

      // 2. Revert balance effect
      if (t.type === "INCOME") {
        await tx.wallet.update({
          where: { id: t.walletId },
          data: { balance: { decrement: t.amount } },
        });
      } else {
        await tx.wallet.update({
          where: { id: t.walletId },
          data: { balance: { increment: t.amount } },
        });
      }

      // 3. Delete transaction
      await tx.transaction.delete({
        where: { id: id },
      });
    });

    return c.json({ success: true, message: "Transaction deleted" });
  } catch (error: any) {
    console.error(error);
    return c.json(
      { error: error?.message || "Failed to delete transaction" },
      500
    );
  }
});

export default app;
