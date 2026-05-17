import { z } from 'zod'

export const updateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, underscores')
      .optional(),
    name: z.string().min(1).max(100).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
  })
  .strict()

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  })
  .strict()

export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
