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
export async function sendPushNotification(payload: PushNotificationPayload) {
  // 1. Save to DB if userId is provided
  if (payload.userId) {
    try {
      await prisma.notification.create({
        data: {
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          data: payload.data ? (payload.data as any) : undefined,
        },
      });
    } catch (e) {
      console.error("Failed to save notification to DB:", e);
    }
  }

  const messages = Array.isArray(payload.to) ? payload.to : [payload.to];

  // Filter out invalid tokens (basic check)
  const validTokens = messages.filter(
    (token) => token && token.startsWith("ExponentPushToken")
  );

  if (validTokens.length === 0) {
    console.log("No valid Expo push tokens found.");
    return;
  }

  const chunks = [];
  const chunkSize = 100; // Expo limit
  for (let i = 0; i < validTokens.length; i += chunkSize) {
    chunks.push(validTokens.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          chunk.map((token) => ({
            to: token,
            title: payload.title,
            body: payload.body,
            data: payload.data,
            sound: payload.sound || "default",
            badge: payload.badge,
          }))
        ),
      });

      const result = await response.json();
      console.log("Expo push notification result:", JSON.stringify(result));
    } catch (error) {
      console.error("Error sending push notification chunk:", error);
    }
  }
}
