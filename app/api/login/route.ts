import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isValidPasscode
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  let passcode = ''

  try {
    const body = await req.json()
    passcode = typeof body.passcode === 'string' ? body.passcode : ''
  } catch {
    passcode = ''
  }

  if (!isValidPasscode(passcode)) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(AUTH_COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  return response
}
