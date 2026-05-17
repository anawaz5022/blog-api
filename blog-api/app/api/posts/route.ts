import { auth } from '@/lib/auth'
import { ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { readRatelimit, retryAfterSeconds, writeRatelimit } from '@/lib/ratelimit'
import {
  created,
  err,
  ok,
  serverError,
  tooManyRequests,
  unauthorized,
  unprocessable,
} from '@/lib/response'
import { getClientIp, readJson, searchParamsToObject } from '@/lib/request'
import { createPostSchema, postQuerySchema } from '@/modules/posts/posts.schema'
import { createPost, listPosts } from '@/modules/posts/posts.service'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const rate = await readRatelimit.limit(`posts:${getClientIp(req)}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const parsed = postQuerySchema.safeParse(searchParamsToObject(new URL(req.url).searchParams))
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const session = await auth()
    const result = await listPosts(
      parsed.data,
      session?.user ? { id: session.user.id, role: session.user.role } : undefined,
    )

    return ok(result.items, result.pagination)
  } catch (error) {
    logger.error({ err: error }, 'Failed to list posts')
    return serverError()
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return unauthorized()

  const rate = await writeRatelimit.limit(`post:create:${session.user.id}`)
  if (!rate.success) return tooManyRequests(retryAfterSeconds(rate.reset))

  const body = await readJson(req)
  if (!body.ok) return err('Invalid JSON body', 400)

  const parsed = createPostSchema.safeParse(body.data)
  if (!parsed.success) return unprocessable(parsed.error.flatten())

  try {
    const post = await createPost(parsed.data, session.user.id)
    return created(post)
  } catch (error) {
    if (error instanceof ValidationError) return unprocessable(error.details)

    logger.error({ err: error }, 'Failed to create post')
    return serverError()
  }
}
