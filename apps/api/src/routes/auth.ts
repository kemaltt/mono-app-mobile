import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as argon2 from 'argon2'
import { sign } from 'hono/jwt'
import prisma from '../lib/prisma'
import { sendVerificationEmail } from '../lib/email'

const auth = new Hono()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyshouldbehidden'

// Register Schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

// Login Schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

// Verify Schema
const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
})

// Resend Schema
const resendSchema = z.object({
  email: z.string().email()
})

// Helper to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString()

// REGISTER
auth.post('/register', zValidator('json', registerSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: result.error.issues[0].message }, 400)
  }
}), async (c) => {
  const { email, password, firstName, lastName } = c.req.valid('json')

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409)
    }

    const hashedPassword = await argon2.hash(password)
    const verificationCode = generateCode()

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        verificationCode,
        isVerified: false,
        wallets: {
            create: {
                name: 'Main Wallet',
                balance: 0,
                currency: 'USD'
            }
        }
      }
    })

    // Send the email (non-blocking if you want speed, but let's wait to be sure)
    try {
        await sendVerificationEmail(email, verificationCode)
    } catch (e) {
        console.error('Initial email send failed:', e)
        // We still created the user, they can resend later
    }

    return c.json({ 
        message: 'Registration successful. Please verify your email.',
        email: user.email 
    }, 201)

  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// VERIFY
auth.post('/verify', zValidator('json', verifySchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: result.error.issues[0].message }, 400)
  }
}), async (c) => {
  const { email, code } = c.req.valid('json')

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (user.isVerified) {
      return c.json({ error: 'User already verified' }, 400)
    }

    if (user.verificationCode !== code) {
      return c.json({ error: 'Invalid verification code' }, 400)
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null
      }
    })

    const token = await sign({ id: user.id, email: user.email }, JWT_SECRET)

    return c.json({ 
        message: 'Email verified successfully',
        token,
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl }
    })

  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// RESEND CODE
auth.post('/resend-code', zValidator('json', resendSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: result.error.issues[0].message }, 400)
  }
}), async (c) => {
  const { email } = c.req.valid('json')

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (user.isVerified) {
      return c.json({ error: 'User already verified' }, 400)
    }

    const verificationCode = generateCode()

    await prisma.user.update({
      where: { email },
      data: { verificationCode }
    })

    await sendVerificationEmail(email, verificationCode)

    return c.json({ message: 'Verification code resent' })

  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// LOGIN
auth.post('/login', zValidator('json', loginSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: result.error.issues[0].message }, 400)
  }
}), async (c) => {
  const { email, password } = c.req.valid('json')

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    if (!user.isVerified) {
      return c.json({ 
        error: 'Please verify your email before logging in',
        notVerified: true,
        email: user.email
      }, 403)
    }

    // Check Account Status
    if (user.status === 'CANCELLED' || user.status === 'DELETED') {
        return c.json({ error: 'This account has been deactivated.' }, 403)
    }

    // Lazy 30-day deletion check
    if (user.status === 'CANCELED_REQUEST' && user.deleteRequestDate) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        if (user.deleteRequestDate < thirtyDaysAgo) {
            // Time expires, cancel account
            await prisma.user.update({
                where: { id: user.id },
                data: { status: 'CANCELLED' }
            })
            return c.json({ error: 'Account deletion process completed. Account deactivated.' }, 403)
        }
    }

    const validPassword = await argon2.verify(user.password, password)
    if (!validPassword) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = await sign({ id: user.id, email: user.email }, JWT_SECRET)

    return c.json({ 
        token, 
        user: { 
            id: user.id, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            avatarUrl: user.avatarUrl,
            status: user.status 
        } 
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default auth
