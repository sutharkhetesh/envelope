import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_COOKIE_NAME, isValidSessionToken } from '@/lib/auth'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value

  if (await isValidSessionToken(token)) {
    redirect('/')
  }

  return <LoginForm />
}
