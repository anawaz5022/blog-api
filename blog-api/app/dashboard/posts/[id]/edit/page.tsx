'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthGuard } from '@/components/auth-guard'
import { PostForm } from '@/components/post-form'
import { apiFetch, type Post, type PostPayload, type Tag } from '@/lib/frontend-api'

export default function EditPostPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!params.id) return

    Promise.all([apiFetch<Post>(`/api/posts/${params.id}`), apiFetch<Tag[]>('/api/tags')])
      .then(([postResponse, tagResponse]) => {
        setPost(postResponse.data)
        setTags(tagResponse.data)
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load post'))
  }, [params.id])

  async function updatePost(payload: PostPayload) {
    if (!params.id) return

    const response = await apiFetch<Post>(`/api/posts/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setPost(response.data)
  }

  async function deletePost() {
    if (!params.id) return
    setIsDeleting(true)
    setError(null)

    try {
      await apiFetch(`/api/posts/${params.id}`, { method: 'DELETE' })
      router.push('/dashboard')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AuthGuard>
      <section className="page-shell editor-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Edit</span>
            <h1>{post?.title ?? 'Post'}</h1>
          </div>
          <div className="button-row">
            {post ? (
              <Link className="ghost-button" href={`/posts/${post.id}`}>
                View
              </Link>
            ) : null}
            <Link className="ghost-button" href="/dashboard">
              Back
            </Link>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {post ? <PostForm post={post} tags={tags} submitLabel="Save changes" onSubmit={updatePost} /> : <div className="skeleton-card" />}

        {post ? (
          <div className="danger-zone">
            <h2>Delete post</h2>
            <button type="button" className="danger-button" disabled={isDeleting} onClick={() => void deletePost()}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ) : null}
      </section>
    </AuthGuard>
  )
}
