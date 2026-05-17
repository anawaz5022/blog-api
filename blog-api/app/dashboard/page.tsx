'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'

import { AuthGuard } from '@/components/auth-guard'
import { EmptyState } from '@/components/empty-state'
import { PostCard } from '@/components/post-card'
import { apiFetch, type Pagination, type Post } from '@/lib/frontend-api'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' })
    if (session?.user.role !== 'ADMIN' && session?.user.id) params.set('authorId', session.user.id)
    if (status) params.set('status', status)
    return params.toString()
  }, [session?.user.id, session?.user.role, status])

  useEffect(() => {
    if (!session?.user) return

    setIsLoading(true)
    apiFetch<Post[]>(`/api/posts?${query}`)
      .then((response) => {
        setPosts(response.data)
        setPagination(response.meta as Pagination)
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load posts'))
      .finally(() => setIsLoading(false))
  }, [query, session?.user])

  const totals = posts.reduce(
    (acc, post) => {
      acc.total += 1
      if (post.status === 'PUBLISHED') acc.published += 1
      if (post.status === 'DRAFT') acc.drafts += 1
      return acc
    },
    { total: 0, published: 0, drafts: 0 },
  )

  return (
    <AuthGuard>
      <section className="page-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Workspace</span>
            <h1>Dashboard</h1>
          </div>
          <Link className="primary-button" href="/dashboard/posts/new">
            New post
          </Link>
        </div>

        <div className="metric-grid">
          <div className="metric-tile">
            <strong>{pagination.total}</strong>
            <span>Total posts</span>
          </div>
          <div className="metric-tile">
            <strong>{totals.published}</strong>
            <span>Published</span>
          </div>
          <div className="metric-tile">
            <strong>{totals.drafts}</strong>
            <span>Drafts</span>
          </div>
        </div>

        <div className="filter-bar compact">
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All visible</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        {isLoading ? (
          <div className="post-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : posts.length > 0 ? (
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                controls={
                  <Link className="secondary-button" href={`/dashboard/posts/${post.id}/edit`}>
                    Edit
                  </Link>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No posts yet"
            body="Draft a post and it will appear here."
            action={
              <Link className="primary-button" href="/dashboard/posts/new">
                New post
              </Link>
            }
          />
        )}
      </section>
    </AuthGuard>
  )
}
