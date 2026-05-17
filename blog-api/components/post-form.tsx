'use client'

import { useMemo, useState } from 'react'

import type { Post, PostPayload, Tag } from '@/lib/frontend-api'

const statusOptions: PostPayload['status'][] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

export function PostForm({
  post,
  tags,
  submitLabel,
  onSubmit,
}: {
  post?: Post
  tags: Tag[]
  submitLabel: string
  onSubmit: (payload: PostPayload) => Promise<void>
}) {
  const initialTagIds = useMemo(() => post?.tags.map(({ tag }) => tag.id) ?? [], [post])
  const [title, setTitle] = useState(post?.title ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [status, setStatus] = useState<PostPayload['status']>(post?.status ?? 'DRAFT')
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTag(tagId: string) {
    setTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      await onSubmit({
        title,
        excerpt: excerpt.trim() || undefined,
        content,
        status,
        tagIds,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save post')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="editor-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
      </label>

      <label>
        Excerpt
        <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={500} rows={3} />
      </label>

      <label>
        Content
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={50000}
          rows={14}
          required
        />
      </label>

      <div className="form-grid">
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as PostPayload['status'])}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option.toLowerCase()}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>Tags</legend>
          <div className="check-row">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <label key={tag.id} className="check-pill">
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))
            ) : (
              <span className="muted">No tags yet</span>
            )}
          </div>
        </fieldset>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary-button" disabled={isSaving}>
        {isSaving ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
