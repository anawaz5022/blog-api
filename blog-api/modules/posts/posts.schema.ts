import { PostStatus } from '@prisma/client'
import { z } from 'zod'

const tagIdsSchema = z
  .array(z.string().cuid())
  .max(10, 'A post can have at most 10 tags')
  .refine((tagIds) => new Set(tagIds).size === tagIds.length, 'Tag ids must be unique')

export const createPostSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required').max(50_000, 'Content too long'),
    excerpt: z.string().max(500, 'Excerpt too long').optional(),
    status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
    tagIds: tagIdsSchema.optional().default([]),
  })
  .strict()

export const updatePostSchema = createPostSchema.partial().strict()

export const postQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.nativeEnum(PostStatus).optional(),
    authorId: z.string().cuid().optional(),
    tagSlug: z.string().max(100).optional(),
    search: z.string().max(200).optional(),
  })
  .strict()

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostQuery = z.infer<typeof postQuerySchema>
