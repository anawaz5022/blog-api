import { Role } from '@prisma/client'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { retryAfterSeconds, writeRatelimit } from '@/lib/ratelimit'
import { forbidden, notFound, ok, serverError, tooManyRequests, unauthorized } from '@/lib/response'
import { deleteTag } from '@/modules/tags/tags.service'

export const runtime = 'nodejs'

const idSchema = z.string().cuid()

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Tag')

  const session = await auth()
  if (!session?.user) return unauthorized()
  if (session.user.role !== Role.ADMIN) return forbidden()

  const rate = await writeRatelimit.limit(`tag:delete:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  try {
    const deleted = await deleteTag(id)
    if (!deleted) return notFound('Tag')

    return ok({ deleted: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete tag')
    return serverError()
  }
}
