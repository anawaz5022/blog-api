import { db } from '@/lib/db'
import { isPrismaUniqueConstraintError } from '@/lib/prisma-errors'
import { slugify } from '@/lib/slug'
import type { CreateTagInput } from '@/modules/tags/tags.schema'

async function createUniqueTagSlug(name: string, preferredSlug?: string) {
  const base = preferredSlug ?? slugify(name)
  let candidate = base
  let suffix = 1

  while (await db.tag.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }

  return candidate
}

export async function listTags() {
  return db.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  })
}

export async function createTag(input: CreateTagInput) {
  try {
    const tag = await db.tag.create({
      data: {
        name: input.name,
        slug: await createUniqueTagSlug(input.name, input.slug),
      },
    })

    return { status: 'created' as const, tag }
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return { status: 'conflict' as const }
    }

    throw error
  }
}

export async function deleteTag(id: string) {
  const deleted = await db.tag.deleteMany({
    where: { id },
  })

  return deleted.count > 0
}
