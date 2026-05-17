import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AppShell } from '@/components/app-shell'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inkline Blog Studio',
  description: 'A full-stack blog app powered by a secure Next.js REST API.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
