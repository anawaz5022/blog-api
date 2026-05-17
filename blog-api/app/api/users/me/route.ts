import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { retryAfterSeconds, writeRatelimit } from '@/lib/ratelimit'
import {
  conflict,
  err,
  ok,
  serverError,
  tooManyRequests,
  unauthorized,
  unprocessable,
} from '@/lib/response'
import { readJson } from '@/lib/request'
import { updateUserSchema } from '@/modules/users/users.schema'
import { updateCurrentUser } from '@/modules/users/users.service'

export const runtime = 'nodejs'

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`user:update:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = updateUserSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const result = await updateCurrentUser(session.user.id, parsed.data)
    if (result.status === 'conflict') return conflict('Username is already taken')

    return ok(result.user)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update current user')
    return serverError()
  }
}
