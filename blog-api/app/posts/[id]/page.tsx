'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { StatusPill } from '@/components/status-pill'
import {
  apiFetch,
  formatDate,
  postTags,
  readingMinutes,
  type Comment,
  type Post,
} from '@/lib/frontend-api'

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const { data: session, status } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  function loadPost() {
    if (!params.id) return

    setIsLoading(true)
    Promise.all([apiFetch<Post>(`/api/posts/${params.id}`), apiFetch<Comment[]>(`/api/posts/${params.id}/comments`)])
      .then(([postResponse, commentResponse]) => {
        setPost(postResponse.data)
        setComments(commentResponse.data)
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load post'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadPost()
  }, [params.id])

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!params.id || !commentBody.trim()) return

    setError(null)
    try {
      const response = await apiFetch<Comment>(`/api/posts/${params.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentBody }),
      })
      setComments((current) => [...current, response.data])
      setCommentBody('')
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Unable to add comment')
    }
  }

  async function updateComment(commentId: string) {
    setError(null)
    try {
      const response = await apiFetch<Comment>(`/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ body: editingBody }),
      })
      setComments((current) => current.map((comment) => (comment.id === commentId ? response.data : comment)))
      setEditingCommentId(null)
      setEditingBody('')
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Unable to update comment')
    }
  }

  async function deleteComment(commentId: string) {
    setError(null)
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      setComments((current) => current.filter((comment) => comment.id !== commentId))
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Unable to delete comment')
    }
  }

  if (isLoading) {
    return (
      <section className="page-shell article-shell">
        <div className="skeleton-card tall" />
      </section>
    )
  }

  if (!post) {
    return (
      <section className="page-shell">
        <EmptyState
          title="Post unavailable"
          body={error ?? 'This post is not available.'}
          action={
            <Link className="primary-button" href="/">
              Back to posts
            </Link>
          }
        />
      </section>
    )
  }

  const canEditPost = session?.user.id === post.author.id || session?.user.role === 'ADMIN'

  return (
    <section className="page-shell article-shell">
      <article className="article-view">
        <div className="article-kicker">
          <StatusPill status={post.status} />
          <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          <span>{readingMinutes(post.content)} min read</span>
        </div>
        <h1>{post.title}</h1>
        {post.excerpt ? <p className="article-excerpt">{post.excerpt}</p> : null}
        <div className="article-byline">
          <span>By {post.author.name || post.author.username}</span>
          {canEditPost ? (
            <Link className="secondary-button" href={`/dashboard/posts/${post.id}/edit`}>
              Edit post
            </Link>
          ) : null}
        </div>
        <div className="tag-row">
          {postTags(post).map((tag) => (
            <span key={tag.id} className="tag-chip">
              {tag.name}
            </span>
          ))}
        </div>
        <div className="article-content">
          {post.content.split('\n').map((paragraph, index) =>
            paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />,
          )}
        </div>
      </article>

      <section className="comments-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Discussion</span>
            <h2>{comments.length} comments</h2>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        {status === 'authenticated' ? (
          <form className="comment-form" onSubmit={addComment}>
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Add a comment"
              required
            />
            <button type="submit" className="primary-button">
              Comment
            </button>
          </form>
        ) : (
          <p className="muted">
            <Link href="/login">Log in</Link> to join the discussion.
          </p>
        )}

        <div className="comment-list">
          {comments.map((comment) => {
            const canManage = session?.user.id === comment.author.id || session?.user.role === 'ADMIN'

            return (
              <article key={comment.id} className="comment-item">
                <div className="comment-meta">
                  <strong>{comment.author.name || comment.author.username}</strong>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>

                {editingCommentId === comment.id ? (
                  <div className="comment-edit">
                    <textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} rows={3} />
                    <div className="button-row">
                      <button type="button" className="primary-button" onClick={() => void updateComment(comment.id)}>
                        Save
                      </button>
                      <button type="button" className="ghost-button" onClick={() => setEditingCommentId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>{comment.body}</p>
                )}

                {canManage && editingCommentId !== comment.id ? (
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setEditingCommentId(comment.id)
                        setEditingBody(comment.body)
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="danger-button" onClick={() => void deleteComment(comment.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </section>
  )
}
