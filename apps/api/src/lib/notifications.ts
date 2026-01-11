import prisma from "./prisma";

export interface PushNotificationPayload {
  to: string | string[];
  userId?: string; // Optional: if provided, save to DB
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
}

/**
 * Sends a push notification using Expo Push API and optionally saves to DB history.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  // 1. Save to DB history
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data: data ? (data as any) : undefined,
      },
    });
  } catch (e) {
    console.error("Failed to save notification to DB:", e);
  }

  // 2. Resolve Push Token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  const token = user?.pushToken;

  if (!token || !token.startsWith("ExponentPushToken")) {
    console.log(`No valid Expo push token for user ${userId}. skipping push.`);
    return;
  }

  // 3. Send via Expo
  try {
    // Basic mapping of our data types to Expo categories (for rich buttons)
    let categoryId = undefined;
    if (data?.type === "budget_threshold") categoryId = "budget";
    if (data?.type === "large_transaction") categoryId = "security";
    if (data?.type === "weekly_summary") categoryId = "summary";

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: "default",
        categoryId, // This enables the buttons we defined in Mobile app
      }),
    });

    const result = await response.json();
    console.log("Expo push notification result:", JSON.stringify(result));
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Legacy support or multi-token sending
 */
export async function sendRawPushNotification(
  payload: PushNotificationPayload
) {
  const messages = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validTokens = messages.filter(
    (token) => token && token.startsWith("ExponentPushToken")
  );

  if (validTokens.length === 0) return;

  for (const token of validTokens) {
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: token,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: payload.sound || "default",
        }),
      });
    } catch (e) {
      console.error(e);
    }
  }
}
