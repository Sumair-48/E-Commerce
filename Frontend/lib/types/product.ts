export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  rating: number
  num_reviews: number
  image_url: string
  stock: number
  tags: string[]
  features: string[]
  created_at: string
  updated_at: string
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  page_size: number
}

export interface RecommendationReason {
  reason: string
  score: number
}

export interface RecommendedProduct extends Product {
  recommendation_reason?: RecommendationReason | string
  relevance_score?: number
}

export interface RecommendationResponse {
  products: RecommendedProduct[]
  recommendation_type: string
}
