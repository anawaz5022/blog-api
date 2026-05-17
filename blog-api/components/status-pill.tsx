import type { PostStatus, Role } from '@prisma/client'

type PillTone = 'draft' | 'published' | 'archived' | 'admin' | 'author' | 'reader'

const toneByStatus: Record<PostStatus, PillTone> = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
}

const toneByRole: Record<Role, PillTone> = {
  ADMIN: 'admin',
  AUTHOR: 'author',
  READER: 'reader',
}

export function StatusPill({ status }: { status: PostStatus }) {
  return <span className={`pill ${toneByStatus[status]}`}>{status.toLowerCase()}</span>
}

export function RolePill({ role }: { role: Role }) {
  return <span className={`pill ${toneByRole[role]}`}>{role.toLowerCase()}</span>
}
