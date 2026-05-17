'use client'

import type { PostStatus, Role } from '@prisma/client'

export type ApiSuccess<T> = {
  data: T
  meta?: Record<string, unknown>
}

export type ApiFailure = {
  error: string
  details?: unknown
}

export type PublicUser = {
  id: string
  username: string
  name: string | null
  bio: string | null
  role: Role
  createdAt: string
  _count?: {
    posts: number
    comments: number
  }
}

export type Tag = {
  id: string
  name: string
  slug: string
  _count?: {
    posts: number
  }
}

export type Post = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  status: PostStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author: PublicUser
  tags: Array<{ tag: Tag }>
  _count?: {
    comments: number
  }
}

export type Comment = {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  author: Pick<PublicUser, 'id' | 'username' | 'name' | 'role'>
}

export type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export type PostPayload = {
  title: string
  content: string
  excerpt?: string
  status: PostStatus
  tagIds: string[]
}

async function parseJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const body = (await parseJson(response)) as ApiSuccess<T> | ApiFailure | null

  if (!response.ok) {
    const message = body && 'error' in body ? body.error : 'Request failed'
    throw new Error(message)
  }

  if (!body || !('data' in body)) {
    throw new Error('Malformed API response')
  }

  return body
}

export function postTags(post: Post) {
  return post.tags.map(({ tag }) => tag)
}

export function formatDate(value: string | null) {
  if (!value) return 'Not published'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function readingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}
