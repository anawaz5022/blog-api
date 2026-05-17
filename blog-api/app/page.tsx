'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { PostCard } from '@/components/post-card'
import { apiFetch, type Pagination, type Post, type Tag } from '@/lib/frontend-api'

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [search, setSearch] = useState('')
  const [tagSlug, setTagSlug] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (search.trim()) params.set('search', search.trim())
    if (tagSlug) params.set('tagSlug', tagSlug)
    return params.toString()
  }, [page, search, tagSlug])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError(null)

    Promise.all([apiFetch<Post[]>(`/api/posts?${query}`), apiFetch<Tag[]>('/api/tags')])
      .then(([postResponse, tagResponse]) => {
        if (!isMounted) return
        setPosts(postResponse.data)
        setPagination(postResponse.meta as Pagination)
        setTags(tagResponse.data)
      })
      .catch((fetchError) => {
        if (!isMounted) return
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load posts')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [query])

  function resetFilters() {
    setSearch('')
    setTagSlug('')
    setPage(1)
  }

  return (
    <section className="page-shell">
      <div className="home-hero">
        <div>
          <span className="eyebrow">Published writing</span>
          <h1>Stories, field notes, and release diaries.</h1>
          <p>
            Browse the newest essays from the team, follow the tags that matter, and keep the conversation moving.
          </p>
        </div>
        <div className="hero-panel" aria-hidden="true">
          <div className="hero-lines">
            <span />
            <span />
            <span />
          </div>
          <strong>{pagination.total}</strong>
          <small>published results</small>
        </div>
      </div>

      <form className="filter-bar" onSubmit={(event) => event.preventDefault()}>
        <label>
          Search
          <input
            value={search}
            placeholder="Title or excerpt"
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </label>
        <label>
          Tag
          <select
            value={tagSlug}
            onChange={(event) => {
              setTagSlug(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost-button" onClick={resetFilters}>
          Clear
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? (
        <div className="post-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-card" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="pagination-row">
            <button type="button" className="ghost-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {pagination.page} of {Math.max(1, pagination.pages)}
            </span>
            <button
              type="button"
              className="ghost-button"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          title="No posts found"
          body="Try a different search or publish a new post from the dashboard."
          action={
            <Link className="primary-button" href="/dashboard/posts/new">
              Write a post
            </Link>
          }
        />
      )}
    </section>
  )
}
