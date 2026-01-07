import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const transactions = await prisma.transaction.findMany({ 
    where: { attachmentUrl: { not: null } },
    select: { id: true, attachmentUrl: true } 
  })
  console.log(JSON.stringify(transactions, null, 2))
}
main()
