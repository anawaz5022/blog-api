import { Role } from '@prisma/client'

import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { readRatelimit, retryAfterSeconds, writeRatelimit } from '@/lib/ratelimit'
import {
  conflict,
  created,
  err,
  forbidden,
  ok,
  serverError,
  tooManyRequests,
  unauthorized,
  unprocessable,
} from '@/lib/response'
import { getClientIp, readJson } from '@/lib/request'
import { createTagSchema } from '@/modules/tags/tags.schema'
import { createTag, listTags } from '@/modules/tags/tags.service'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const rate = await readRatelimit.limit(`tags:${getClientIp(req)}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  try {
    return ok(await listTags())
  } catch (error) {
    logger.error({ err: error }, 'Failed to list tags')
    return serverError()
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return unauthorized()
  if (session.user.role !== Role.ADMIN) return forbidden()

  const rate = await writeRatelimit.limit(`tag:create:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = createTagSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const result = await createTag(parsed.data)
    if (result.status === 'conflict') return conflict('Tag already exists')

    return created(result.tag)
  } catch (error) {
    logger.error({ err: error }, 'Failed to create tag')
    return serverError()
  }
}
