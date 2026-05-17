import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const authorPassword = await bcrypt.hash('Author123!', 12)

  const admin = await db.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  })

  const author = await db.user.upsert({
    where: { email: 'author@example.com' },
    update: {},
    create: {
      email: 'author@example.com',
      username: 'testauthor',
      name: 'Test Author',
      passwordHash: authorPassword,
      role: Role.AUTHOR,
    },
  })

  const tag = await db.tag.upsert({
    where: { slug: 'next-js' },
    update: {},
    create: { name: 'Next.js', slug: 'next-js' },
  })

  await db.post.upsert({
    where: { slug: 'hello-world' },
    update: {},
    create: {
      title: 'Hello World',
      slug: 'hello-world',
      content: 'This is the first post on the blog.',
      excerpt: 'A test post.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: author.id,
      tags: { create: [{ tagId: tag.id }] },
    },
  })

  console.log('Seed complete. Admin:', admin.email, '| Author:', author.email)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
