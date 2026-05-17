'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import type { ReactNode } from 'react'

import { RolePill } from '@/components/status-pill'

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const isSignedIn = status === 'authenticated'

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Inkline home">
          <span className="brand-mark">I</span>
          <span>
            <strong>Inkline</strong>
            <small>Blog Studio</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/">Posts</Link>
          {isSignedIn ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              {session.user.role === 'ADMIN' ? <Link href="/dashboard/tags">Tags</Link> : null}
              <Link href="/settings">Settings</Link>
              <button type="button" className="ghost-button" onClick={() => void signOut({ callbackUrl: '/' })}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="nav-cta">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <span>Inkline API and editorial workspace</span>
        {session?.user ? (
          <span className="footer-user">
            {session.user.username}
            <RolePill role={session.user.role} />
          </span>
        ) : null}
      </footer>
    </>
  )
}
