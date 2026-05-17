import { PostStatus } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import { loginSchema, registerSchema } from '@/modules/auth/auth.schema'
import { createCommentSchema } from '@/modules/comments/comments.schema'
import { createPostSchema, postQuerySchema } from '@/modules/posts/posts.schema'
import { createTagSchema } from '@/modules/tags/tags.schema'
import { changePasswordSchema, updateUserSchema } from '@/modules/users/users.schema'

describe('Zod schemas', () => {
  it('accepts a valid registration body', () => {
    const parsed = registerSchema.safeParse({
      email: 'author@example.com',
      username: 'author_1',
      password: 'Password123',
      name: 'Author',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects extra registration fields and weak passwords', () => {
    const parsed = registerSchema.safeParse({
      email: 'author@example.com',
      username: 'author',
      password: 'password',
      role: 'ADMIN',
    })

    expect(parsed.success).toBe(false)
  })

  it('keeps login input strict', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'Password123' }).success).toBe(true)
    expect(
      loginSchema.safeParse({
        email: 'user@example.com',
        password: 'Password123',
        rememberMe: true,
      }).success,
    ).toBe(false)
  })

  it('validates post creation and query coercion', () => {
    const post = createPostSchema.parse({
      title: 'Hello',
      content: 'Body',
      status: PostStatus.PUBLISHED,
      tagIds: [],
    })
    const query = postQuerySchema.parse({ page: '2', limit: '10', search: 'hello' })

    expect(post.status).toBe(PostStatus.PUBLISHED)
    expect(query).toMatchObject({ page: 2, limit: 10 })
    expect(postQuerySchema.safeParse({ limit: '101' }).success).toBe(false)
  })

  it('validates comments, user updates, passwords, and tags', () => {
    expect(createCommentSchema.safeParse({ body: 'Nice post' }).success).toBe(true)
    expect(createCommentSchema.safeParse({ body: '' }).success).toBe(false)

    expect(updateUserSchema.safeParse({ username: 'new_name', bio: null }).success).toBe(true)
    expect(changePasswordSchema.safeParse({ currentPassword: 'Old12345', newPassword: 'New12345' }).success).toBe(
      true,
    )

    expect(createTagSchema.safeParse({ name: 'Next.js', slug: 'next-js' }).success).toBe(true)
    expect(createTagSchema.safeParse({ name: 'Next.js', slug: 'Next JS' }).success).toBe(false)
  })
})
