import { PostStatus, Prisma, Role } from '@prisma/client'

import { db } from '@/lib/db'
import { ValidationError } from '@/lib/errors'
import { slugify } from '@/lib/slug'
import type { CreatePostInput, PostQuery, UpdatePostInput } from '@/modules/posts/posts.schema'
import type { SessionUser } from '@/modules/posts/posts.types'

const postInclude = {
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      role: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.PostInclude

async function createUniquePostSlug(title: string, excludeId?: string) {
  const base = slugify(title)
  let candidate = base
  let suffix = 1

  while (
    await db.post.findFirst({
      where: excludeId ? { slug: candidate, NOT: { id: excludeId } } : { slug: candidate },
      select: { id: true },
    })
  ) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }

  return candidate
}

async function ensureTagsExist(tagIds: string[]) {
  if (tagIds.length === 0) return

  const tags = await db.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true },
  })

  if (tags.length !== tagIds.length) {
    throw new ValidationError('One or more tags do not exist', { tagIds })
  }
}

function buildVisibilityWhere(query: PostQuery, viewer?: SessionUser): Prisma.PostWhereInput {
  if (query.status) {
    if (query.status === PostStatus.PUBLISHED) {
      return { status: PostStatus.PUBLISHED }
    }

    if (viewer?.role === Role.ADMIN) {
      return { status: query.status }
    }

    if (viewer) {
      return { status: query.status, authorId: viewer.id }
    }

    return { AND: [{ status: query.status }, { status: PostStatus.PUBLISHED }] }
  }

  if (viewer?.role === Role.ADMIN) {
    return {}
  }

  if (viewer) {
    return {
      OR: [{ status: PostStatus.PUBLISHED }, { authorId: viewer.id }],
    }
  }

  return { status: PostStatus.PUBLISHED }
}

export async function listPosts(query: PostQuery, viewer?: SessionUser) {
  const filters: Prisma.PostWhereInput[] = [buildVisibilityWhere(query, viewer)]

  if (query.authorId) {
    filters.push({ authorId: query.authorId })
  }

  if (query.tagSlug) {
    filters.push({
      tags: {
        some: {
          tag: {
            slug: query.tagSlug,
          },
        },
      },
    })
  }

  if (query.search) {
    filters.push({
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { excerpt: { contains: query.search, mode: 'insensitive' } },
      ],
    })
  }

  const where: Prisma.PostWhereInput = { AND: filters }
  const skip = (query.page - 1) * query.limit

  const [items, total] = await db.$transaction([
    db.post.findMany({
      where,
      include: postInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    db.post.count({ where }),
  ])

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  }
}

export async function getPostById(id: string) {
  return db.post.findUnique({
    where: { id },
    include: postInclude,
  })
}

export async function createPost(input: CreatePostInput, authorId: string) {
  await ensureTagsExist(input.tagIds)

  const status = input.status

  return db.post.create({
    data: {
      title: input.title,
      slug: await createUniquePostSlug(input.title),
      content: input.content,
      excerpt: input.excerpt,
      status,
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      authorId,
      tags: {
        create: input.tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: postInclude,
  })
}

export async function updatePost(id: string, input: UpdatePostInput, userId: string, isAdmin: boolean) {
  if (input.tagIds) {
    await ensureTagsExist(input.tagIds)
  }

  const postData: Prisma.PostUpdateInput = {}

  if (input.title !== undefined) {
    postData.title = input.title
    postData.slug = await createUniquePostSlug(input.title, id)
  }

  if (input.content !== undefined) postData.content = input.content
  if (input.excerpt !== undefined) postData.excerpt = input.excerpt

  if (input.status !== undefined) {
    postData.status = input.status
    postData.publishedAt = input.status === PostStatus.PUBLISHED ? new Date() : null
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.post.findFirst({
      where: isAdmin ? { id } : { id, authorId: userId },
      select: { id: true },
    })

    if (!existing) return null

    if (Object.keys(postData).length > 0) {
      await tx.post.update({
        where: { id },
        data: postData,
        select: { id: true },
      })
    }

    if (input.tagIds) {
      await tx.tagsOnPosts.deleteMany({ where: { postId: id } })
      if (input.tagIds.length > 0) {
        await tx.tagsOnPosts.createMany({
          data: input.tagIds.map((tagId) => ({ postId: id, tagId })),
          skipDuplicates: true,
        })
      }
    }

    return tx.post.findUnique({
      where: { id },
      include: postInclude,
    })
  })
}

export async function deletePost(id: string, userId: string, isAdmin: boolean) {
  const result = await db.post.deleteMany({
    where: isAdmin ? { id } : { id, authorId: userId },
  })

  return result.count > 0
}
