import { NextRequest, NextResponse } from 'next/server'

const sessionCookieNames = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
]

function hasSessionCookie(req: NextRequest) {
  return sessionCookieNames.some((name) => req.cookies.has(name))
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.AUTH_URL ?? 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders() })
  }

  const { pathname } = req.nextUrl
  const isAuthRoute = pathname.startsWith('/api/auth')
  const isWriteRequest = ['POST', 'PUT', 'DELETE'].includes(req.method)

  if (!isAuthRoute && isWriteRequest && !hasSessionCookie(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
