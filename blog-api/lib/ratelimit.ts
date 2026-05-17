import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type RateLimitResult = Awaited<ReturnType<Ratelimit['limit']>>
type RateLimiter = Pick<Ratelimit, 'limit'>

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

function fallbackLimit(): RateLimitResult {
  const reset = Date.now() + 60_000

  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset,
      pending: Promise.resolve(),
    }
  }

  return {
    success: true,
    limit: Number.POSITIVE_INFINITY,
    remaining: Number.POSITIVE_INFINITY,
    reset,
    pending: Promise.resolve(),
  }
}

function createLimiter(prefix: string, tokens: number, window: `${number} ${'s' | 'm' | 'h'}`): RateLimiter {
  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken })

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      analytics: true,
      prefix,
    })
  }

  return {
    limit: async () => fallbackLimit(),
  }
}

export function retryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000))
}

export const authRatelimit = createLimiter('ratelimit:auth', 5, '15 m')
export const writeRatelimit = createLimiter('ratelimit:write', 30, '1 h')
export const readRatelimit = createLimiter('ratelimit:read', 100, '1 m')
