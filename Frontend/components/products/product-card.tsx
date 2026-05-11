'use client'

import { Product } from '@/lib/types/product'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { trackingService } from '@/lib/utils/tracking'
import { toast } from 'sonner'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  const [isHovered, setIsHovered] = useState(false)

  // Track product view on mount
  useEffect(() => {
    trackingService.trackProductView(product.id, product.category)
  }, [product.id, product.category])

  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    trackingService.trackAddToCart(product.id, product.price)
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
    })
    toast.success('Added to cart')
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    if (inWishlist) {
      trackingService.trackRemoveFromWishlist(product.id)
      removeFromWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      trackingService.trackAddToWishlist(product.id)
      addToWishlist(product.id)
      toast.success('Added to wishlist')
    }
  }

  const handleCardClick = () => {
    trackingService.trackProductClick(product.id, product.category)
  }

  return (
    <Link href={`/products/${product.id}`} onClick={handleCardClick}>
      <Card
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative w-full aspect-square bg-muted overflow-hidden">
          <Image
            src={product.image_url || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-semibold">Out of Stock</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          {/* Category */}
          <p className="text-xs font-medium text-primary uppercase">{product.category}</p>

          {/* Title */}
          <div>
            <h3 className="font-semibold line-clamp-2 text-base">{product.name}</h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.num_reviews})</span>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
          </div>
        </div>

        {/* Action Buttons - Show on hover or mobile */}
        {isHovered && (
          <div className="border-t p-3 flex gap-2 bg-card/50 backdrop-blur">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleWishlistToggle}
              className="flex-1"
            >
              <Heart
                className={`w-4 h-4 ${inWishlist ? 'fill-current text-destructive' : ''}`}
              />
            </Button>
          </div>
        )}
      </Card>
    </Link>
  )
}
