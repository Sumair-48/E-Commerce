'use client'

import { RecommendedProduct } from '@/lib/types/product'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingCart, Star, Zap } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { toast } from 'sonner'
import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface RecommendationCardProps {
  product: RecommendedProduct
  showReason?: boolean
}

export function RecommendationCard({ product, showReason = true }: RecommendationCardProps) {
  const { addItem } = useCartStore()
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  const [isHovered, setIsHovered] = useState(false)

  const inWishlist = isInWishlist(product.id)
  const reasonText =
    typeof product.recommendation_reason === 'string'
      ? product.recommendation_reason
      : product.recommendation_reason?.reason
  const matchScore =
    typeof product.relevance_score === 'number'
      ? product.relevance_score
      : typeof product.recommendation_reason === 'object' && product.recommendation_reason
      ? product.recommendation_reason.score
      : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
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
      removeFromWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product.id)
      toast.success('Added to wishlist')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/products/${product.id}`}>
        <Card
          className="overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full flex flex-col group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Container */}
          <div className="relative w-full aspect-video bg-muted overflow-hidden">
            <Image
              src={product.image_url || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Recommendation Badge */}
            {showReason && (
              <div className="absolute top-2 left-2">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge className="bg-primary/80 backdrop-blur flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {matchScore !== null ? `${Math.round(matchScore * 100)}% match` : 'Recommended'}
                  </Badge>
                </motion.div>
              </div>
            )}

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

            {/* Reason */}
            {showReason && (
              <div className="text-xs text-muted-foreground italic">
                {reasonText || 'Picked based on popular trends and your activity.'}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({product.num_reviews})</span>
            </div>

            {/* Price */}
            <div className="mt-auto">
              <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons - Show on hover */}
          {isHovered && (
            <div className="border-t p-3 flex gap-2 bg-card/50 backdrop-blur">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
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
    </motion.div>
  )
}
