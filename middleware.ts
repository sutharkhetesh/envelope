import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, isValidSessionToken } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value
  const isLoggedIn = await isValidSessionToken(token)

  if (isLoggedIn) {
    return NextResponse.next()
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.redirect(new URL('/login', req.url))
}

export const config = {
  matcher: ['/', '/api/init-db', '/api/addresses/:path*']
}
