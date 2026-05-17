import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import { db } from '@/lib/db'
import { loginSchema } from '@/modules/auth/auth.schema'

const timingSafePasswordHash = '$2b$12$C6UzMDM.H6dfI/f/IKcEeOQ5pR5UT1VhXqAo3yX7Y2Jq7sC4G6x7W'
type AuthorizedUser = { id: string; role: Role; username: string }

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const authorizedUser = user as AuthorizedUser
        token.id = authorizedUser.id
        token.role = authorizedUser.role
        token.username = authorizedUser.username
      }

      if (trigger === 'update' && typeof token.id === 'string') {
        const refreshedUser = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, username: true },
        })

        if (refreshedUser) {
          token.role = refreshedUser.role
          token.username = refreshedUser.username
        }
      }

      return token
    },
    async session({ session, token }) {
      const sessionToken = token as { id?: string; role?: Role; username?: string }

      if (session.user && sessionToken.id && sessionToken.role && sessionToken.username) {
        session.user.id = sessionToken.id
        session.user.role = sessionToken.role
        session.user.username = sessionToken.username
      }

      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })

        const passwordHash = user?.passwordHash ?? timingSafePasswordHash
        const isValid = await bcrypt.compare(parsed.data.password, passwordHash)

        if (!user || !isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username,
        }
      },
    }),
  ],
})
