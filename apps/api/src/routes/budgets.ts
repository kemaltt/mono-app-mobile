import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { verify } from 'hono/jwt'
import prisma from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyshouldbehidden'

type Variables = {
  user: {
    id: string
    email: string
  }
}

const app = new Hono<{ Variables: Variables }>()

app.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401)
  const token = authHeader.split(' ')[1]
  try {
    const payload = await verify(token, JWT_SECRET)
    c.set('user', payload as any)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

const createBudgetSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
  category: z.string(),
  color: z.string().optional(),
})

// GET / - List budgets with spent calculation (Monthly default)
app.get('/', async (c) => {
    const user = c.get('user')
    try {
        const budgets = await prisma.budget.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        })

        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const budgetsWithSpent = await Promise.all(budgets.map(async (b) => {
            const expenseAgg = await prisma.transaction.aggregate({
                where: {
                    userId: user.id,
                    type: 'EXPENSE',
                    category: b.category,
                    date: { gte: firstDayOfMonth }
                },
                _sum: { amount: true }
            })
            return {
                ...b,
                spent: expenseAgg._sum.amount || 0
            }
        }))

        return c.json({ budgets: budgetsWithSpent })
    } catch (e) {
        console.error(e)
        return c.json({ error: 'Internal error' }, 500)
    }
})

// POST / - Create Budget
app.post('/', zValidator('json', createBudgetSchema), async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    try {
        // Check if budget for this category already exists
        const existing = await prisma.budget.findFirst({
            where: { userId: user.id, category: body.category }
        })

        if (existing) {
            return c.json({ error: 'Budget for this category already exists' }, 400)
        }

        const budget = await prisma.budget.create({
            data: {
                userId: user.id,
                name: body.name,
                amount: body.amount,
                category: body.category,
                color: body.color,
                period: 'MONTHLY'
            }
        })
        return c.json(budget, 201)
    } catch (e) {
        console.error(e)
        return c.json({ error: 'Failed to create budget' }, 500)
    }
})

// DELETE /:id
app.delete('/:id', async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    try {
        await prisma.budget.deleteMany({
            where: { id: id, userId: user.id }
        })
        return c.json({ success: true })
    } catch (e) {
        return c.json({ error: 'Failed to delete' }, 500)
    }
})

export default app
