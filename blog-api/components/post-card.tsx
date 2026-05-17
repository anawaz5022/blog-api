import Link from 'next/link'

import { StatusPill } from '@/components/status-pill'
import { formatDate, postTags, readingMinutes, type Post } from '@/lib/frontend-api'

export function PostCard({ post, controls }: { post: Post; controls?: React.ReactNode }) {
  return (
    <article className="post-card">
      <div className="post-card-cover" aria-hidden="true">
        <span>{post.author.username.slice(0, 2).toUpperCase()}</span>
      </div>
      <div className="post-card-body">
        <div className="post-card-meta">
          <StatusPill status={post.status} />
          <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          <span>{readingMinutes(post.content)} min read</span>
        </div>
        <h2>
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt || post.content.slice(0, 180)}</p>
        <div className="tag-row">
          {postTags(post).map((tag) => (
            <span key={tag.id} className="tag-chip">
              {tag.name}
            </span>
          ))}
        </div>
        <div className="post-card-footer">
          <span>By {post.author.name || post.author.username}</span>
          <span>{post._count?.comments ?? 0} comments</span>
        </div>
        {controls ? <div className="card-controls">{controls}</div> : null}
      </div>
    </article>
  )
}
