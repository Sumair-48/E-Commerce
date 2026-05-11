'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heart, ShoppingCart, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { productsAPI } from '@/lib/api/products'
import { Product } from '@/lib/types/product'
import { toast } from 'sonner'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { addItem } = useCartStore()
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        const data = await productsAPI.getById(productId)
        setProduct(data)
      } catch (error) {
        console.error('[v0] Failed to load product:', error)
        toast.error('Failed to load product')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Button variant="outline" asChild className="mb-8">
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <p className="text-muted-foreground text-center">Product not found</p>
        </div>
      </div>
    )
  }

  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
    })
    toast.success('Added to cart')
  }

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product.id)
      toast.success('Added to wishlist')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <Button variant="outline" asChild className="mb-8">
          <Link href="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        {/* Product Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden aspect-square">
            <Image
              src={product.image_url || '/placeholder.jpg'}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            {/* Category */}
            <div>
              <Badge variant="secondary">{product.category}</Badge>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold">{product.rating.toFixed(1)} out of 5</p>
                <p className="text-muted-foreground">({product.num_reviews} reviews)</p>
              </div>
            </div>

            <Separator />

            {/* Price */}
            <div>
              <p className="text-5xl font-bold">${product.price.toFixed(2)}</p>
            </div>

            {/* Stock Status */}
            <div>
              {product.stock > 0 ? (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  In Stock ({product.stock} available)
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleWishlistToggle}
                className="w-14"
              >
                <Heart
                  className={`w-5 h-5 ${inWishlist ? 'fill-current text-destructive' : ''}`}
                />
              </Button>
            </div>

            <Separator />

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Features</h2>
            <ul className="grid md:grid-cols-2 gap-4">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
