'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ShoppingBag, Heart, TrendingUp, Package } from 'lucide-react'
import { RecommendationRail } from '@/components/recommendations/recommendation-rail'
import { recommendationsAPI } from '@/lib/api/recommendations'
import { RecommendedProduct } from '@/lib/types/product'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const rawCartItems = useCartStore((state) => state.items)
  const cartTotal = useCartStore((state) => state.getTotal())
  const rawWishlistItems = useWishlistStore((state) => state.items)
  
  const [personalizedProducts, setPersonalizedProducts] = useState<RecommendedProduct[]>([])
  const [trendingProducts, setTrendingProducts] = useState<RecommendedProduct[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true)
  const cartItems = Array.isArray(rawCartItems) ? rawCartItems : []
  const wishlistItems = Array.isArray(rawWishlistItems) ? rawWishlistItems : []
  const categories = Array.isArray(user?.preferences?.categories) ? user.preferences.categories : []
  const interests = Array.isArray(user?.preferences?.interests) ? user.preferences.interests : []
  const budgetRange = user?.preferences?.budget_range ?? [0, 0]

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsLoadingRecommendations(true)
        const [personalized, trending] = await Promise.all([
          recommendationsAPI.getPersonalized(10),
          recommendationsAPI.getTrending(10),
        ])
        setPersonalizedProducts(personalized.products)
        setTrendingProducts(trending.products)
      } catch (error) {
        console.error('[v0] Failed to load recommendations:', error)
        // Silently fail - recommendations are nice to have
      } finally {
        setIsLoadingRecommendations(false)
      }
    }

    loadRecommendations()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user?.username || 'Shopper'}! 👋</h1>
          <p className="text-muted-foreground">
            Your personalized shopping experience starts here
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cart Items</p>
                <p className="text-3xl font-bold">{cartItems.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary opacity-50" />
            </div>
            {cartItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Total: ${cartTotal.toFixed(2)}
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Wishlist Items</p>
                <p className="text-3xl font-bold">{wishlistItems.length}</p>
              </div>
              <Heart className="w-8 h-8 text-destructive opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget</p>
                <p className="text-2xl font-bold">
                  {budgetRange[1] > 0 ? `$${budgetRange[1]}` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Categories</p>
                <p className="text-3xl font-bold">{categories.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>
        </div>

        {/* Preferences */}
        {user?.preferences && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Preferences</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Favorite Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Budget Range</p>
                  <p className="text-lg font-semibold">
                    ${budgetRange[0]} - ${budgetRange[1]}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Shopping Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span key={interest} className="px-3 py-1 bg-secondary rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/products">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Browse Products
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href="/wishlist">
                    <Heart className="w-4 h-4 mr-2" />
                    View Wishlist
                  </Link>
                </Button>
                {cartItems.length > 0 && (
                  <Button className="w-full justify-start" asChild>
                    <Link href="/checkout">Go to Checkout</Link>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-12">
          {personalizedProducts.length > 0 && (
            <RecommendationRail
              title="Recommended For You"
              subtitle="Based on your preferences and shopping history"
              products={personalizedProducts}
              isLoading={isLoadingRecommendations}
            />
          )}

          {trendingProducts.length > 0 && (
            <RecommendationRail
              title="Trending Now"
              subtitle="Popular items other shoppers are loving"
              products={trendingProducts}
              isLoading={isLoadingRecommendations}
            />
          )}
        </div>

        {/* Featured Section */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mt-12">
          <h2 className="text-2xl font-bold mb-4">Ready to explore?</h2>
          <p className="text-muted-foreground mb-6">
            Browse our AI-curated collection of products tailored to your preferences
          </p>
          <Button size="lg" asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
