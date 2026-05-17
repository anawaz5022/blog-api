import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address').max(255),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(1).max(100).optional(),
  })
  .strict()

export const loginSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(72),
  })
  .strict()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
