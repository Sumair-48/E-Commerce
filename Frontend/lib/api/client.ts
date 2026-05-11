import axios from 'axios'
import { useAuthStore } from '@/lib/store/auth'

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
// Avoid intermittent localhost/IPv6 resolution issues on Windows by forcing IPv4 loopback.
const API_BASE_URL = rawApiUrl.replace('://localhost', '://127.0.0.1')
const FALLBACK_API_BASE_URL = API_BASE_URL.includes('127.0.0.1')
  ? API_BASE_URL.replace('127.0.0.1', 'localhost')
  : API_BASE_URL.replace('localhost', '127.0.0.1')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Retry once on low-level network failures by swapping loopback host.
    if (!error.response && originalRequest && !originalRequest._retryWithFallbackHost) {
      originalRequest._retryWithFallbackHost = true
      originalRequest.baseURL = FALLBACK_API_BASE_URL
      return apiClient.request(originalRequest)
    }

    if (error.response?.status === 401) {
      // Unauthorized - logout user
      useAuthStore.getState().logout()
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
