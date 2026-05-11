import apiClient from '@/lib/api/client'

export interface TrackingEvent {
  event_type: string
  product_id?: string
  category?: string
  value?: number
  timestamp?: string
}

class TrackingService {
  private queue: TrackingEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private trackingEndpointUnavailable = false

  constructor() {
    // Flush events every 30 seconds
    if (typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => this.flush(), 30000)
    }
  }

  track(event: TrackingEvent) {
    if (typeof window === 'undefined') return // Skip server-side

    event.timestamp = new Date().toISOString()
    this.queue.push(event)

    // Auto-flush if queue gets too large
    if (this.queue.length >= 10) {
      this.flush()
    }
  }

  trackProductView(productId: string, category: string) {
    this.track({
      event_type: 'product_view',
      product_id: productId,
      category,
    })
  }

  trackProductClick(productId: string, category: string) {
    this.track({
      event_type: 'product_click',
      product_id: productId,
      category,
    })
  }

  trackAddToCart(productId: string, value: number) {
    this.track({
      event_type: 'add_to_cart',
      product_id: productId,
      value,
    })
  }

  trackAddToWishlist(productId: string) {
    this.track({
      event_type: 'add_to_wishlist',
      product_id: productId,
    })
  }

  trackRemoveFromWishlist(productId: string) {
    this.track({
      event_type: 'remove_from_wishlist',
      product_id: productId,
    })
  }

  trackPurchase(totalValue: number) {
    this.track({
      event_type: 'purchase',
      value: totalValue,
    })
  }

  trackSearch(query: string) {
    this.track({
      event_type: 'search',
      value: query.length,
    })
  }

  private async flush() {
    if (this.queue.length === 0 || typeof window === 'undefined' || this.trackingEndpointUnavailable) return

    const eventsToFlush = [...this.queue]
    this.queue = []

    const interactionTypeMap: Record<string, string> = {
      product_view: 'view',
      product_click: 'click',
      add_to_cart: 'add_to_cart',
      add_to_wishlist: 'wishlist',
      purchase: 'purchase',
    }

    const interactionEvents = eventsToFlush.filter((event) => {
      const mappedType = interactionTypeMap[event.event_type]
      const parsedId = Number(event.product_id)
      return Boolean(mappedType) && Number.isFinite(parsedId) && parsedId > 0
    })

    try {
      if (interactionEvents.length === 0) {
        return
      }

      await Promise.all(
        interactionEvents.map((event) =>
          apiClient.post('/interactions', {
            product_id: Number(event.product_id),
            interaction_type: interactionTypeMap[event.event_type],
            source: 'frontend_tracking',
          })
        )
      )
    } catch (error: any) {
      // If API route is unavailable, stop retry noise for this browser session.
      if (error?.response?.status === 404) {
        this.trackingEndpointUnavailable = true
        return
      }

      console.error('[v0] Failed to flush tracking events:', error)
      // Re-queue events on failure
      this.queue = eventsToFlush.concat(this.queue)
    }
  }

  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush()
  }
}

export const trackingService = new TrackingService()
