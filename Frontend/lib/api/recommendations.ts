import apiClient from './client'
import { RecommendationResponse } from '@/lib/types/product'

const normalizeRecommendationResponse = (
  data: RecommendationResponse | RecommendationResponse['products']
): RecommendationResponse => {
  if (Array.isArray(data)) {
    return {
      products: data,
      recommendation_type: 'default',
    }
  }
  return data
}

export const recommendationsAPI = {
  getPersonalized: async (limit: number = 10) => {
    const response = await apiClient.get<RecommendationResponse>(
      '/recommendations/personalized',
      {
        params: { limit },
      }
    )
    return normalizeRecommendationResponse(response.data)
  },

  getTrending: async (limit: number = 10) => {
    const response = await apiClient.get<RecommendationResponse>(
      '/recommendations/trending',
      {
        params: { limit },
      }
    )
    return normalizeRecommendationResponse(response.data)
  },

  getSimilar: async (productId: string, limit: number = 10) => {
    const response = await apiClient.get<RecommendationResponse>(
      `/recommendations/similar/${productId}`,
      {
        params: { limit },
      }
    )
    return normalizeRecommendationResponse(response.data)
  },

  getComplementary: async (productId: string, limit: number = 10) => {
    const response = await apiClient.get<RecommendationResponse>(
      `/recommendations/complementary/${productId}`,
      {
        params: { limit },
      }
    )
    return normalizeRecommendationResponse(response.data)
  },

  getCategoryBased: async (category: string, limit: number = 10) => {
    const response = await apiClient.get<RecommendationResponse>(
      `/recommendations/category/${category}`,
      {
        params: { limit },
      }
    )
    return normalizeRecommendationResponse(response.data)
  },

  getViewHistory: async (limit: number = 10) => {
    const response = await apiClient.get<RecommendationResponse>(
      '/recommendations/recently-viewed',
      {
        params: { limit },
      }
    )
    return normalizeRecommendationResponse(response.data)
  },
}
