'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store/auth'
import { authAPI } from '@/lib/api/auth'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Login and get token
      const tokenResponse = await authAPI.login(data)
      setToken(tokenResponse.access_token)

      // Store token in cookie for middleware
      document.cookie = `auth-token=${tokenResponse.access_token}; path=/; max-age=86400`

      // Get user profile
      const userProfile = await authAPI.getProfile()
      setUser(userProfile)

      // Set onboarding-completed cookie if user has completed onboarding
      if (userProfile.onboarding_completed) {
        document.cookie = 'onboarding-completed=true; path=/; max-age=31536000'
      }

      // Set is-admin cookie if user is admin
      if (userProfile.is_admin) {
        document.cookie = `is-admin=true; path=/; max-age=86400`
      } else {
        document.cookie = 'is-admin=; path=/; max-age=0'
      }

      toast.success('Logged in successfully!')

      // Redirect based on onboarding status
      const redirectPath = userProfile.onboarding_completed ? '/dashboard' : '/onboarding'
      router.push(redirectPath)
    } catch (error) {
      console.error('[v0] Login error:', error)
      toast.error('Failed to login. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <a href="/register" className="font-semibold hover:underline">
            Sign up
          </a>
        </div>
      </div>
    </Card>
  )
}
