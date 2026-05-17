import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { retryAfterSeconds, writeRatelimit } from '@/lib/ratelimit'
import {
  err,
  notFound,
  ok,
  serverError,
  tooManyRequests,
  unauthorized,
  unprocessable,
} from '@/lib/response'
import { readJson } from '@/lib/request'
import { changePasswordSchema } from '@/modules/users/users.schema'
import { changePassword } from '@/modules/users/users.service'

export const runtime = 'nodejs'

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`user:password:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = changePasswordSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const result = await changePassword(session.user.id, parsed.data)

    if (result.status === 'missing') return notFound('User')
    if (result.status === 'invalid-current-password') {
      return err('Current password is incorrect', 403)
    }

    return ok({ updated: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to change password')
    return serverError()
  }
}
