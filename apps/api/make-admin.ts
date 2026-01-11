import prisma from "./src/lib/prisma";

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: "ADMIN" },
    });
    console.log(`Success: User ${user.email} is now an ADMIN.`);
  } catch (error) {
    console.error(`Error: User with email ${email} not found.`);
  } finally {
    process.exit(0);
  }
}

// Get email from command line argument
const emailArg = process.argv[2];
if (!emailArg) {
  console.log("Usage: tsx make-admin.ts user@example.com");
  process.exit(1);
}

makeAdmin(emailArg);
