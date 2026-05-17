import { Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import type { CreateCommentInput, UpdateCommentInput } from '@/modules/comments/comments.schema'

const commentInclude = {
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
    },
  },
} satisfies Prisma.CommentInclude

export async function listComments(postId: string) {
  return db.comment.findMany({
    where: { postId },
    include: commentInclude,
    orderBy: { createdAt: 'asc' },
  })
}

export async function createComment(postId: string, authorId: string, input: CreateCommentInput) {
  const post = await db.post.findFirst({
    where: { id: postId, status: 'PUBLISHED' },
    select: { id: true },
  })

  if (!post) return null

  return db.comment.create({
    data: {
      postId,
      authorId,
      body: input.body,
    },
    include: commentInclude,
  })
}

export async function updateComment(id: string, input: UpdateCommentInput, userId: string, isAdmin: boolean) {
  const updated = await db.comment.updateMany({
    where: isAdmin ? { id } : { id, authorId: userId },
    data: { body: input.body },
  })

  if (updated.count === 0) return null

  return db.comment.findUnique({
    where: { id },
    include: commentInclude,
  })
}

export async function deleteComment(id: string, userId: string, isAdmin: boolean) {
  const deleted = await db.comment.deleteMany({
    where: isAdmin ? { id } : { id, authorId: userId },
  })

  return deleted.count > 0
}
