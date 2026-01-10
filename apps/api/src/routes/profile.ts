import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import * as argon2 from 'argon2'
import prisma from '../lib/prisma'
import { sendPasswordChangeEmail, sendDeleteRequestEmail, sendDeleteConfirmEmail, sendUndoDeleteEmail, sendUndoConfirmEmail } from '../lib/email'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const profile = new Hono()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyshouldbehidden'

// Middleware to protect routes
profile.use('/*', jwt({ secret: JWT_SECRET }))

// Helper to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString()

// GET ME
profile.get('/me', async (c) => {
  const payload = c.get('jwtPayload')
  const user = await prisma.user.findUnique({
    where: { id: payload.id }
  })
  if (!user) return c.json({ error: 'User not found' }, 404)
  
  const { password, verificationCode, ...safeUser } = user
  return c.json(safeUser)
})

// REQUEST PASSWORD CHANGE
profile.post('/request-password-change', async (c) => {
  const payload = c.get('jwtPayload')
  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const code = generateCode()
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode: code }
  })

  await sendPasswordChangeEmail(user.email, code)
  return c.json({ message: 'Verification code sent to your email' })
})

// CHANGE PASSWORD
const changePasswordSchema = z.object({
  code: z.string().length(6),
  newPassword: z.string().min(6)
})

profile.post('/change-password', zValidator('json', changePasswordSchema, (result, c) => {
  if (!result.success) return c.json({ error: result.error.issues[0].message }, 400)
}), async (c) => {
  const payload = c.get('jwtPayload')
  const { code, newPassword } = c.req.valid('json')

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  if (user.verificationCode !== code) {
    return c.json({ error: 'Invalid verification code' }, 400)
  }

  const hashedPassword = await argon2.hash(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      verificationCode: null
    }
  })

  return c.json({ message: 'Password changed successfully' })
})

// UPDATE PROFILE
const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  timezone: z.string().optional()
})

profile.post('/update', zValidator('json', updateProfileSchema, (result, c) => {
  if (!result.success) return c.json({ error: result.error.issues[0].message }, 400)
}), async (c) => {
  const payload = c.get('jwtPayload')
  const { email, firstName, lastName, timezone } = c.req.valid('json')

  const data: any = {}
  if (firstName) data.firstName = firstName
  if (lastName) data.lastName = lastName
  if (timezone) data.timezone = timezone

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== payload.id) {
       return c.json({ error: 'Email already in use' }, 400)
    }
    data.email = email
  }

  const user = await prisma.user.update({
    where: { id: payload.id },
    data
  })

  const { password: _, verificationCode: __, deleteCode: ___, ...safeUser } = user
  return c.json({ message: 'Profile updated', user: safeUser })
})

// AVATAR UPLOAD
profile.post('/avatar', async (c) => {
  const payload = c.get('jwtPayload')
  const body = await c.req.parseBody()
  const image = body['file'] as File

  if (!image) {
    return c.json({ error: 'No image provided' }, 400)
  }

  try {
    const ext = path.extname(image.name)
    const fileName = `${randomUUID()}${ext}`
    const userId = payload.id
    const uploadDir = path.join(process.cwd(), 'uploads', userId, 'profile')
    const filePath = path.join(uploadDir, fileName)

    // Ensure user-specific profile directory exists
    await fs.mkdir(uploadDir, { recursive: true })

    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(filePath, buffer)

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.avatarUrl && user.avatarUrl.includes('/uploads/')) {
       // Extract relative path from URL to locate and delete the physical file
       const urlParts = user.avatarUrl.split('/uploads/')
       const relativeFilePath = urlParts[1]
       const oldPath = path.join(process.cwd(), 'uploads', relativeFilePath)
       
       try {
         await fs.unlink(oldPath)
       } catch (e) {
         console.error('Failed to delete old avatar file:', e)
       }
    }

    const host = c.req.header('host')
    const isLocal = host?.includes('localhost') || host?.includes('192.168.') || host?.includes('127.0.0.1')
    const protocol = isLocal ? 'http' : 'https'
    const avatarUrl = `${protocol}://${host}/uploads/${userId}/profile/${fileName}`

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    })

    return c.json({ avatarUrl })

  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to upload avatar' }, 500)
  }
})


// REQUEST DELETE ACCOUNT
profile.post('/delete-request', async (c) => {
  const payload = c.get('jwtPayload')
  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const code = generateCode()
  await prisma.user.update({
    where: { id: user.id },
    data: { deleteCode: code }
  })

  await sendDeleteRequestEmail(user.email, code)
  return c.json({ message: 'Verification code sent' })
})

// CONFIRM DELETE
const confirmDeleteSchema = z.object({
  code: z.string().length(6)
})

profile.post('/delete-confirm', zValidator('json', confirmDeleteSchema), async (c) => {
  const payload = c.get('jwtPayload')
  const { code } = c.req.valid('json')

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  if (user.deleteCode !== code) {
    return c.json({ error: 'Invalid verification code' }, 400)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'CANCELED_REQUEST',
      deleteRequestDate: new Date(),
      deleteCode: null
    }
  })

  await sendDeleteConfirmEmail(user.email)
  return c.json({ message: 'Account scheduled for deletion' })
})

// REQUEST UNDO DELETE
profile.post('/undo-delete-request', async (c) => {
  const payload = c.get('jwtPayload')
  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  if (user.status !== 'CANCELED_REQUEST') {
     return c.json({ error: 'Account is not pending deletion' }, 400)
  }

  const code = generateCode()
  await prisma.user.update({
    where: { id: user.id },
    data: { deleteCode: code }
  })

  await sendUndoDeleteEmail(user.email, code)
  return c.json({ message: 'Verification code sent' })
})

// CONFIRM UNDO DELETE
profile.post('/undo-delete-confirm', zValidator('json', confirmDeleteSchema), async (c) => {
  const payload = c.get('jwtPayload')
  const { code } = c.req.valid('json')

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  if (user.deleteCode !== code) {
    return c.json({ error: 'Invalid verification code' }, 400)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'ACTIVE',
      deleteRequestDate: null,
      deleteCode: null
    }
  })

  await sendUndoConfirmEmail(user.email)
  return c.json({ message: 'Account deletion cancelled' })
})

export default profile
