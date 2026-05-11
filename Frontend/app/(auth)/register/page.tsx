import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a new account',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <RegisterForm />
    </div>
  )
}
