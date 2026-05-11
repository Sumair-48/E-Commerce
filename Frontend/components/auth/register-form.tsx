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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don&apos;t match',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const userResponse = await authAPI.register({
        name: data.name,
        email: data.email,
        password: data.password,
      })

      // After registration, automatically login to get token
      const tokenResponse = await authAPI.login({
        email: data.email,
        password: data.password,
      })

      // Store token in both Zustand and cookie
      setToken(tokenResponse.access_token)
      document.cookie = `auth-token=${tokenResponse.access_token}; path=/; max-age=86400`
      
      // Set user in store
      setUser(userResponse)
      
      // Set is-admin cookie if user is admin
      if (userResponse.is_admin) {
        document.cookie = `is-admin=true; path=/; max-age=86400`
      }
      
      // Clear onboarding-completed cookie since new user needs to onboard
      document.cookie = 'onboarding-completed=; path=/; max-age=0'
      
      toast.success('Account created successfully!')
      router.push('/onboarding')
    } catch (error) {
      console.error('[v0] Register error:', error)
      toast.error('Failed to create account. Email may already be in use.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Join our AI-powered shopping community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <a href="/login" className="font-semibold hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </Card>
  )
}
