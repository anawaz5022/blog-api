import { PostStatus, Role } from '@prisma/client'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { readRatelimit, retryAfterSeconds, writeRatelimit } from '@/lib/ratelimit'
import {
  created,
  err,
  notFound,
  ok,
  serverError,
  tooManyRequests,
  unauthorized,
  unprocessable,
} from '@/lib/response'
import { getClientIp, readJson } from '@/lib/request'
import { createCommentSchema } from '@/modules/comments/comments.schema'
import { createComment, listComments } from '@/modules/comments/comments.service'
import { getPostById } from '@/modules/posts/posts.service'

export const runtime = 'nodejs'

const idSchema = z.string().cuid()

type RouteContext = {
  params: Promise<{ id: string }>
}

async function canReadPost(id: string) {
  const post = await getPostById(id)
  if (!post) return false

  const session = await auth()
  const isOwner = session?.user?.id === post.author.id
  const isAdmin = session?.user?.role === Role.ADMIN

  return post.status === PostStatus.PUBLISHED || isOwner || isAdmin
}

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Post')

  const rate = await readRatelimit.limit(`comments:${getClientIp(req)}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  try {
    if (!(await canReadPost(id))) return notFound('Post')

    const comments = await listComments(id)
    return ok(comments)
  } catch (error) {
    logger.error({ err: error }, 'Failed to list comments')
    return serverError()
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Post')

  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`comment:create:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = createCommentSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const comment = await createComment(id, session.user.id, parsed.data)
    if (!comment) return notFound('Post')

    return created(comment)
  } catch (error) {
    logger.error({ err: error }, 'Failed to create comment')
    return serverError()
  }
}
