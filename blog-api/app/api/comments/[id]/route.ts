import { Role } from '@prisma/client'
import { z } from 'zod'

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
import { updateCommentSchema } from '@/modules/comments/comments.schema'
import { deleteComment, updateComment } from '@/modules/comments/comments.service'

export const runtime = 'nodejs'

const idSchema = z.string().cuid()

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Comment')

  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`comment:update:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = updateCommentSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const comment = await updateComment(id, parsed.data, session.user.id, session.user.role === Role.ADMIN)
    if (!comment) return notFound('Comment')

    return ok(comment)
  } catch (error) {
    logger.error({ err: error }, 'Failed to update comment')
    return serverError()
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Comment')

  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`comment:delete:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  try {
    const deleted = await deleteComment(id, session.user.id, session.user.role === Role.ADMIN)
    if (!deleted) return notFound('Comment')

    return ok({ deleted: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete comment')
    return serverError()
  }
}
