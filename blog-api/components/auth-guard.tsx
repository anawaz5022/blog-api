'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/empty-state'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession()

  if (status === 'loading') {
    return <section className="page-shell narrow-shell"><div className="skeleton-card" /></section>
  }

  if (status !== 'authenticated') {
    return (
      <section className="page-shell narrow-shell">
        <EmptyState
          title="Sign in required"
          body="Your writing workspace is available after login."
          action={
            <Link className="primary-button" href="/login">
              Log in
            </Link>
          }
        />
      </section>
    )
  }

  return children
}
