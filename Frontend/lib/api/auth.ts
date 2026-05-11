import apiClient from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface OnboardingRequest {
  categories: string[]
  budget_range: [number, number]
  interests: string[]
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserResponse {
  id: number
  email: string
  username: string
  onboarding_completed: boolean
  is_admin: boolean
  preferences?: {
    categories: string[]
    budget_range: [number, number]
    interests: string[]
  }
}

export const authAPI = {
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<UserResponse>('/auth/register', data)
    return response.data
  },

  login: async (data: LoginRequest) => {
    const formData = new URLSearchParams()
    formData.append('username', data.email)
    formData.append('password', data.password)
    
    const response = await apiClient.post<TokenResponse>(
      '/auth/login',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    return response.data
  },

  onboarding: async (data: OnboardingRequest) => {
    const response = await apiClient.post<UserResponse>('/auth/onboarding', data)
    return response.data
  },

  getProfile: async () => {
    const response = await apiClient.get<UserResponse>('/auth/profile')
    return response.data
  },
}
