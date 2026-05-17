import { describe, expect, it } from 'vitest'

import { authRatelimit, retryAfterSeconds } from '@/lib/ratelimit'

describe('rate limiter fallback', () => {
  it('allows requests in test mode without Upstash credentials', async () => {
    const result = await authRatelimit.limit('test-ip')

    expect(result.success).toBe(true)
    expect(retryAfterSeconds(result.reset)).toBeGreaterThan(0)
  })
})
