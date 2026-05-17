import { describe, expect, it } from 'vitest'

import { conflict, created, ok, tooManyRequests, unprocessable } from '@/lib/response'

describe('response helpers', () => {
  it('returns the success shape with optional metadata', async () => {
    const response = ok([{ id: 'post_1' }], { page: 1 })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [{ id: 'post_1' }],
      meta: { page: 1 },
    })
  })

  it('returns created resources', async () => {
    const response = created({ id: 'user_1' })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ data: { id: 'user_1' } })
  })

  it('returns error shapes and retry headers', async () => {
    const validation = unprocessable({ fieldErrors: { title: ['Required'] } })
    const duplicate = conflict('Email is already registered')
    const limited = tooManyRequests(42)

    expect(validation.status).toBe(422)
    expect(await validation.json()).toEqual({
      error: 'Validation failed',
      details: { fieldErrors: { title: ['Required'] } },
    })
    expect(duplicate.status).toBe(409)
    expect(limited.headers.get('Retry-After')).toBe('42')
  })
})
