import bcrypt from 'bcryptjs'

import { db } from '@/lib/db'
import { isPrismaUniqueConstraintError } from '@/lib/prisma-errors'
import type { RegisterInput } from '@/modules/auth/auth.schema'
import { publicUserSelect } from '@/modules/users/users.service'

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase()
  const username = input.username.toLowerCase()

  const existing = await db.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: {
      email: true,
      username: true,
    },
  })

  if (existing?.email === email) {
    return { status: 'email-conflict' as const }
  }

  if (existing?.username === username) {
    return { status: 'username-conflict' as const }
  }

  try {
    const user = await db.user.create({
      data: {
        email,
        username,
        name: input.name,
        passwordHash: await bcrypt.hash(input.password, 12),
      },
      select: publicUserSelect,
    })

    return { status: 'created' as const, user }
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return { status: 'conflict' as const }
    }

    throw error
  }
}
