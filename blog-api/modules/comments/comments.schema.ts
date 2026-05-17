import { z } from 'zod'

export const createCommentSchema = z
  .object({
    body: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  })
  .strict()

export const updateCommentSchema = createCommentSchema.strict()

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
