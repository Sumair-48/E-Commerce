import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  email: string
  username: string
  onboarding_completed: boolean
  is_admin?: boolean
  preferences?: {
    categories: string[]
    budget_range: [number, number]
    interests: string[]
  }
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        // Clear cookies
        document.cookie = 'auth-token=; path=/; max-age=0'
        document.cookie = 'onboarding-completed=; path=/; max-age=0'
        document.cookie = 'is-admin=; path=/; max-age=0'
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
