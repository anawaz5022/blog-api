import { z } from 'zod'

export const createTagSchema = z
  .object({
    name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
    slug: z
      .string()
      .min(1)
      .max(100)
      .refine(
        (slug) => slug.split('-').every((part) => part.length > 0 && /^[a-z0-9]+$/.test(part)),
        'Slug must be lowercase words separated by hyphens',
      )
      .optional(),
  })
  .strict()

export type CreateTagInput = z.infer<typeof createTagSchema>
