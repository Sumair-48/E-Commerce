'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { productsAPI } from '@/lib/api/products'
import { Product } from '@/lib/types/product'
import { useWishlistStore } from '@/lib/store/wishlist'
import { useCartStore } from '@/lib/store/cart'
import { ProductGrid } from '@/components/products/product-grid'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const wishlistIds = useWishlistStore((state) => state.items)
  const { addItem } = useCartStore()

  useEffect(() => {
    const loadWishlistProducts = async () => {
      try {
        setIsLoading(true)
        if (wishlistIds.length === 0) {
          setProducts([])
          return
        }

        // Load all products and filter by wishlist IDs
        const response = await productsAPI.getAll({ page_size: 100 })
        const filtered = response.items.filter((p) => wishlistIds.includes(p.id))
        setProducts(filtered)
      } catch (error) {
        console.error('[v0] Failed to load wishlist:', error)
        toast.error('Failed to load wishlist')
      } finally {
        setIsLoading(false)
      }
    }

    loadWishlistProducts()
  }, [wishlistIds])

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
    })
    toast.success('Added to cart')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground mt-2">
            {products.length === 0
              ? 'Your wishlist is empty'
              : `${products.length} item${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {products.length === 0 ? (
          <Empty>
            <EmptyContent>
              <EmptyTitle>Your wishlist is empty</EmptyTitle>
              <EmptyDescription>
                Start adding items to your wishlist to save them for later
              </EmptyDescription>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div>
            <ProductGrid products={products} isLoading={isLoading} />

            {/* Quick Actions */}
            {products.length > 0 && (
              <Card className="p-6 mt-8 bg-primary/5 border-primary/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Add all to cart</h3>
                    <p className="text-sm text-muted-foreground">
                      Move all wishlist items to your shopping cart
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      products.forEach((product) => handleAddToCart(product))
                      toast.success('All items added to cart')
                    }}
                    className="whitespace-nowrap"
                  >
                    Add All to Cart
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
