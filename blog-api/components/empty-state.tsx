import type { ReactNode } from 'react'

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <section className="empty-state">
      <div className="empty-visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </section>
  )
}
