import apiClient from './client'

export interface CartItem {
  product_id: string
  quantity: number
}

export interface CartResponse {
  items: CartItem[]
  total: number
  total_items: number
}

export const cartAPI = {
  getCart: async () => {
    const response = await apiClient.get<CartResponse>('/cart')
    return response.data
  },

  addToCart: async (productId: string, quantity: number = 1) => {
    const response = await apiClient.post<CartResponse>('/cart/add', {
      product_id: productId,
      quantity,
    })
    return response.data
  },

  removeFromCart: async (productId: string) => {
    const response = await apiClient.delete<CartResponse>(`/cart/items/${productId}`)
    return response.data
  },

  updateCartItem: async (productId: string, quantity: number) => {
    const response = await apiClient.put<CartResponse>(`/cart/items/${productId}`, {
      quantity,
    })
    return response.data
  },

  clearCart: async () => {
    const response = await apiClient.delete<CartResponse>('/cart')
    return response.data
  },
}
