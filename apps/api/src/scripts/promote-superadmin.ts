import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "masaloungee@gmail.com";
  const user = await prisma.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN" as any },
  });
  console.log(`User ${email} updated to SUPER_ADMIN`);
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
