import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { db } from '@/lib/db'
import { isPrismaUniqueConstraintError } from '@/lib/prisma-errors'
import type { ChangePasswordInput, UpdateUserInput } from '@/modules/users/users.schema'

export const publicUserSelect = {
  id: true,
  username: true,
  name: true,
  bio: true,
  role: true,
  createdAt: true,
  _count: {
    select: {
      posts: true,
      comments: true,
    },
  },
} satisfies Prisma.UserSelect

export async function getPublicUser(id: string) {
  return db.user.findUnique({
    where: { id },
    select: publicUserSelect,
  })
}

export async function updateCurrentUser(userId: string, input: UpdateUserInput) {
  const data: Prisma.UserUpdateInput = {}

  if (input.username !== undefined) data.username = input.username
  if (input.name !== undefined) data.name = input.name
  if (input.bio !== undefined) data.bio = input.bio

  try {
    const user = await db.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    })

    return { status: 'updated' as const, user }
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return { status: 'conflict' as const }
    }

    throw error
  }
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  })

  if (!user) return { status: 'missing' as const }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash)
  if (!passwordMatches) return { status: 'invalid-current-password' as const }

  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(input.newPassword, 12),
    },
    select: { id: true },
  })

  return { status: 'updated' as const }
}
