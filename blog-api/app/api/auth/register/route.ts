import { authRatelimit, retryAfterSeconds } from '@/lib/ratelimit'
import { conflict, created, err, serverError, tooManyRequests, unprocessable } from '@/lib/response'
import { getClientIp, readJson } from '@/lib/request'
import { logger } from '@/lib/logger'
import { registerSchema } from '@/modules/auth/auth.schema'
import { registerUser } from '@/modules/auth/auth.service'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const rate = await authRatelimit.limit(`register:${getClientIp(req)}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = registerSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const result = await registerUser(parsed.data)

    if (result.status === 'created') return created(result.user)
    if (result.status === 'email-conflict') return conflict('Email is already registered')
    if (result.status === 'username-conflict') return conflict('Username is already taken')

    return conflict('User already exists')
  } catch (error) {
    logger.error({ err: error }, 'Failed to register user')
    return serverError()
  }
}
