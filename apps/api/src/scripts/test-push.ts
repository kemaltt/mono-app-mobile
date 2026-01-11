import prisma from "../lib/prisma";
import { sendPushNotification } from "../lib/notifications";

async function sendTestNotification(email: string) {
  console.log(`Searching for user: ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.pushToken) {
    console.error(`Error: User ${email} not found or has no push token.`);
    process.exit(1);
  }

  console.log(`Sending test notification to ${email}...`);
  await sendPushNotification({
    to: user.pushToken,
    userId: user.id,
    title: "Mono Test Bildirimi 🚀",
    body: "Selam! Push bildirim sistemimiz başarıyla çalışıyor. Bu bir test mesajıdır. 👋",
    data: { screen: "Dashboard", test: true },
  });

  console.log("Test notification sent successfully!");
}

const targetEmail = process.argv[2] || "masaloungee@gmail.com";
sendTestNotification(targetEmail)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
