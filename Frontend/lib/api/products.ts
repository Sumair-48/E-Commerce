import apiClient from './client'
import { Product, ProductListResponse, RecommendationResponse } from '@/lib/types/product'

export interface ProductFilters {
  category?: string
  brand?: string
  min_price?: number
  max_price?: number
  search?: string
  sort_by?: 'relevance' | 'price' | 'rating' | 'newest'
  page?: number
  page_size?: number
}

const normalizeProductListResponse = (
  data: ProductListResponse | Product[]
): ProductListResponse => {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      page_size: data.length,
    }
  }
  return data
}

export const productsAPI = {
  getAll: async (filters?: ProductFilters) => {
    const response = await apiClient.get<ProductListResponse | Product[]>('/products', {
      params: filters,
    })
    return normalizeProductListResponse(response.data)
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Product>(`/products/${id}`)
    return response.data
  },

  search: async (query: string, filters?: Omit<ProductFilters, 'search'>) => {
    // Backend supports searching via /products?search=...
    const response = await apiClient.get<ProductListResponse | Product[]>('/products', {
      params: { search: query, ...filters },
    })
    return normalizeProductListResponse(response.data)
  },

  getByCategory: async (category: string, filters?: Omit<ProductFilters, 'category'>) => {
    const response = await apiClient.get<ProductListResponse | Product[]>('/products', {
      params: { ...filters, category },
    })
    return normalizeProductListResponse(response.data)
  },

  getRecommendations: async (type: string, limit: number = 10) => {
    const response = await apiClient.get<RecommendationResponse>(
      `/recommendations/${type}`,
      {
        params: { limit },
      }
    )
    return response.data
  },

  getCategories: async () => {
    const response = await apiClient.get<Array<{ id: number; name: string }>>('/categories')
    return response.data.map((category) => category.name)
  },
}
