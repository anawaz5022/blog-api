import { PostStatus, Role } from '@prisma/client'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { ValidationError } from '@/lib/errors'
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
import { updatePostSchema } from '@/modules/posts/posts.schema'
import { deletePost, getPostById, updatePost } from '@/modules/posts/posts.service'

export const runtime = 'nodejs'

const idSchema = z.string().cuid()

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Post')

  try {
    const post = await getPostById(id)
    if (!post) return notFound('Post')

    const session = await auth()
    const isOwner = session?.user?.id === post.author.id
    const isAdmin = session?.user?.role === Role.ADMIN

    if (post.status !== PostStatus.PUBLISHED && !isOwner && !isAdmin) {
      return notFound('Post')
    }

    return ok(post)
  } catch (error) {
    logger.error({ err: error }, 'Failed to get post')
    return serverError()
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Post')

  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`post:update:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = updatePostSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const post = await updatePost(id, parsed.data, session.user.id, session.user.role === Role.ADMIN)
    if (!post) return notFound('Post')

    return ok(post)
  } catch (error) {
    if (error instanceof ValidationError) return unprocessable(error.details)

    logger.error({ err: error }, 'Failed to update post')
    return serverError()
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return notFound('Post')

  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`post:delete:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  try {
    const deleted = await deletePost(id, session.user.id, session.user.role === Role.ADMIN)
    if (!deleted) return notFound('Post')

    return ok({ deleted: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete post')
    return serverError()
  }
}
