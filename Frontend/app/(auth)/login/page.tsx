import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm />
    </div>
  )
}
