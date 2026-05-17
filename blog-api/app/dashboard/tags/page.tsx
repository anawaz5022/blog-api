'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import { AuthGuard } from '@/components/auth-guard'
import { EmptyState } from '@/components/empty-state'
import { apiFetch, type Tag } from '@/lib/frontend-api'

export default function TagsPage() {
  const { data: session } = useSession()
  const [tags, setTags] = useState<Tag[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function loadTags() {
    apiFetch<Tag[]>('/api/tags')
      .then((response) => setTags(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load tags'))
  }

  useEffect(() => {
    loadTags()
  }, [])

  async function createTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    try {
      await apiFetch<Tag>('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name, slug: slug.trim() || undefined }),
      })
      setName('')
      setSlug('')
      setMessage('Tag created')
      loadTags()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create tag')
    }
  }

  async function deleteTag(tagId: string) {
    setError(null)
    setMessage(null)

    try {
      await apiFetch(`/api/tags/${tagId}`, { method: 'DELETE' })
      setMessage('Tag deleted')
      loadTags()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete tag')
    }
  }

  return (
    <AuthGuard>
      <section className="page-shell two-column">
        <div>
          <span className="eyebrow">Taxonomy</span>
          <h1>Tags</h1>
          {session?.user.role !== 'ADMIN' ? <p className="form-error">Admin access required</p> : null}
          {message ? <p className="form-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        {session?.user.role === 'ADMIN' ? (
          <div className="stack">
            <form className="editor-form surface" onSubmit={createTag}>
              <h2>Create tag</h2>
              <label>
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} required />
              </label>
              <label>
                Slug
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value.toLowerCase())}
                  placeholder="optional"
                  maxLength={100}
                />
              </label>
              <button type="submit" className="primary-button">
                Create
              </button>
            </form>

            {tags.length > 0 ? (
              <div className="tag-manager">
                {tags.map((tag) => (
                  <div key={tag.id} className="tag-row-item">
                    <span>
                      <strong>{tag.name}</strong>
                      <small>{tag.slug}</small>
                    </span>
                    <span>{tag._count?.posts ?? 0} posts</span>
                    <button type="button" className="danger-button" onClick={() => void deleteTag(tag.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No tags" body="Create the first tag for posts." />
            )}
          </div>
        ) : null}
      </section>
    </AuthGuard>
  )
}
