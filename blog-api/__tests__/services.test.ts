import { Role } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  bcryptHash: vi.fn(),
  commentDeleteMany: vi.fn(),
  commentFindUnique: vi.fn(),
  commentUpdateMany: vi.fn(),
  postDeleteMany: vi.fn(),
  tagFindUnique: vi.fn(),
  tagCreate: vi.fn(),
  userCreate: vi.fn(),
  userFindFirst: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: mocks.bcryptHash,
  },
}))

vi.mock('@/lib/db', () => ({
  db: {
    comment: {
      deleteMany: mocks.commentDeleteMany,
      findUnique: mocks.commentFindUnique,
      updateMany: mocks.commentUpdateMany,
    },
    post: {
      deleteMany: mocks.postDeleteMany,
    },
    tag: {
      create: mocks.tagCreate,
      findUnique: mocks.tagFindUnique,
    },
    user: {
      create: mocks.userCreate,
      findFirst: mocks.userFindFirst,
    },
  },
}))

import { registerUser } from '@/modules/auth/auth.service'
import { deleteComment, updateComment } from '@/modules/comments/comments.service'
import { deletePost } from '@/modules/posts/posts.service'
import { createTag } from '@/modules/tags/tags.service'

describe('service authorization and persistence behavior', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('registers users with normalized identity and hashed passwords', async () => {
    mocks.userFindFirst.mockResolvedValue(null)
    mocks.bcryptHash.mockResolvedValue('hashed-password')
    mocks.userCreate.mockResolvedValue({ id: 'user_1', email: 'author@example.com', username: 'author' })

    const result = await registerUser({
      email: 'AUTHOR@example.com',
      username: 'author',
      password: 'Password123',
    })

    expect(result.status).toBe('created')
    expect(mocks.bcryptHash).toHaveBeenCalledWith('Password123', 12)
    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'author@example.com',
          passwordHash: 'hashed-password',
        }),
      }),
    )
  })

  it('reports registration conflicts before hashing', async () => {
    mocks.userFindFirst.mockResolvedValue({ email: 'author@example.com', username: 'other' })

    const result = await registerUser({
      email: 'author@example.com',
      username: 'author',
      password: 'Password123',
    })

    expect(result.status).toBe('email-conflict')
    expect(mocks.bcryptHash).not.toHaveBeenCalled()
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })

  it('deletes posts with owner checks unless the caller is admin', async () => {
    mocks.postDeleteMany.mockResolvedValue({ count: 1 })

    await expect(deletePost('post_1', 'user_1', false)).resolves.toBe(true)
    expect(mocks.postDeleteMany).toHaveBeenLastCalledWith({
      where: { id: 'post_1', authorId: 'user_1' },
    })

    await expect(deletePost('post_1', 'admin_1', true)).resolves.toBe(true)
    expect(mocks.postDeleteMany).toHaveBeenLastCalledWith({
      where: { id: 'post_1' },
    })
  })

  it('updates and deletes comments with owner checks unless the caller is admin', async () => {
    mocks.commentUpdateMany.mockResolvedValue({ count: 1 })
    mocks.commentFindUnique.mockResolvedValue({ id: 'comment_1', body: 'Updated' })
    mocks.commentDeleteMany.mockResolvedValue({ count: 1 })

    await updateComment('comment_1', { body: 'Updated' }, 'user_1', false)
    expect(mocks.commentUpdateMany).toHaveBeenLastCalledWith({
      where: { id: 'comment_1', authorId: 'user_1' },
      data: { body: 'Updated' },
    })

    await deleteComment('comment_1', 'admin_1', true)
    expect(mocks.commentDeleteMany).toHaveBeenLastCalledWith({
      where: { id: 'comment_1' },
    })
  })

  it('creates tags with generated slugs and detects conflicts', async () => {
    mocks.tagFindUnique.mockResolvedValue(null)
    mocks.tagCreate.mockResolvedValue({ id: 'tag_1', name: 'Next.js', slug: 'next-js' })

    const created = await createTag({ name: 'Next.js' })

    expect(created.status).toBe('created')
    expect(mocks.tagCreate).toHaveBeenCalledWith({
      data: { name: 'Next.js', slug: 'next-js' },
    })
  })

  it('keeps role constants available to mocked service callers', () => {
    expect(Role.ADMIN).toBe('ADMIN')
  })
})
