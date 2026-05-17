import { z } from 'zod'

import { logger } from '@/lib/logger'
import { readRatelimit, retryAfterSeconds } from '@/lib/ratelimit'
import { notFound, ok, serverError, tooManyRequests } from '@/lib/response'
import { getClientIp } from '@/lib/request'
import { getPublicUser } from '@/modules/users/users.service'

export const runtime = 'nodejs'

const idSchema = z.string().cuid()

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('User')

  const rate = await readRatelimit.limit(`user:${getClientIp(req)}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  try {
    const user = await getPublicUser(id)
    if (!user) return notFound('User')

    return ok(user)
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user')
    return serverError()
  }
}
