export const AUTH_COOKIE_NAME = 'envelope_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const VALID_PASSCODES = new Set(['2305', '3615'])
const FALLBACK_AUTH_SECRET = 'envelope-printer-local-auth-secret'

type SessionPayload = {
  exp: number
  v: 1
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || FALLBACK_AUTH_SECRET
}

function toBase64Url(value: string | ArrayBuffer) {
  const bytes =
    typeof value === 'string'
      ? new TextEncoder().encode(value)
      : new Uint8Array(value)
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value)
  )
  return toBase64Url(signature)
}

export function isValidPasscode(passcode: string) {
  return VALID_PASSCODES.has(passcode.trim())
}

export async function createSessionToken() {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    v: 1
  }
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export async function isValidSessionToken(token: string | undefined) {
  if (!token) return false

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  const expectedSignature = await sign(encodedPayload)
  if (signature !== expectedSignature) return false

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload
    return payload.v === 1 && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
