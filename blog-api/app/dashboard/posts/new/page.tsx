'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthGuard } from '@/components/auth-guard'
import { PostForm } from '@/components/post-form'
import { apiFetch, type Post, type PostPayload, type Tag } from '@/lib/frontend-api'

export default function NewPostPage() {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Tag[]>('/api/tags')
      .then((response) => setTags(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load tags'))
  }, [])

  async function createPost(payload: PostPayload) {
    const response = await apiFetch<Post>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    router.push(`/dashboard/posts/${response.data.id}/edit`)
  }

  return (
    <AuthGuard>
      <section className="page-shell editor-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Compose</span>
            <h1>New post</h1>
          </div>
          <Link className="ghost-button" href="/dashboard">
            Back
          </Link>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <PostForm tags={tags} submitLabel="Create post" onSubmit={createPost} />
      </section>
    </AuthGuard>
  )
}
