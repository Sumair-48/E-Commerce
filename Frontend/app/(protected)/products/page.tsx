'use client'

import { useState, useEffect } from 'react'
import { Metadata } from 'next'
import { ProductGrid } from '@/components/products/product-grid'
import { FiltersSidebar, FilterState } from '@/components/products/filters-sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { productsAPI } from '@/lib/api/products'
import { recommendationsAPI } from '@/lib/api/recommendations'
import { Product } from '@/lib/types/product'
import { trackingService } from '@/lib/utils/tracking'
import { toast } from 'sonner'

type SortOption = 'relevance' | 'price' | 'rating' | 'newest' | 'all'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 10000],
    minRating: 0,
    inStockOnly: false,
  })

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await productsAPI.getCategories()
        setCategories(cats)
      } catch (error) {
        console.error('[v0] Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Load products when filters or search change
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        let data

        // If searching, always use search endpoint
        if (searchQuery) {
          trackingService.trackSearch(searchQuery)
          data = await productsAPI.search(searchQuery, {
            sort_by: sortBy === 'relevance' ? 'relevance' : sortBy === 'price' ? 'price' : sortBy,
            page: 1,
            page_size: 50,
          })
          let filtered = data.items

          // Apply category filter
          if (filters.categories.length > 0) {
            filtered = filtered.filter((p) => filters.categories.includes(p.category))
          }

          // Apply price filter
          filtered = filtered.filter(
            (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
          )

          // Apply rating filter
          if (filters.minRating > 0) {
            filtered = filtered.filter((p) => p.rating >= filters.minRating)
          }

          // Apply stock filter
          if (filters.inStockOnly) {
            filtered = filtered.filter((p) => p.stock > 0)
          }

          setProducts(filtered)
        } else if (sortBy === 'relevance') {
          // For relevance, fetch personalized recommendations
          const recommendedData = await recommendationsAPI.getPersonalized(50)
          let filtered = recommendedData.products

          // Apply category filter
          if (filters.categories.length > 0) {
            filtered = filtered.filter((p) => filters.categories.includes(p.category))
          }

          // Apply price filter
          filtered = filtered.filter(
            (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
          )

          // Apply rating filter
          if (filters.minRating > 0) {
            filtered = filtered.filter((p) => p.rating >= filters.minRating)
          }

          // Apply stock filter
          if (filters.inStockOnly) {
            filtered = filtered.filter((p) => p.stock > 0)
          }

          setProducts(filtered)
        } else {
          // For all other sorts, fetch all products with the specified sort
          data = await productsAPI.getAll({
            sort_by: sortBy === 'price' ? 'price' : sortBy === 'rating' ? 'rating' : sortBy,
            page: 1,
            page_size: 50,
          })

          let filtered = data.items

          // Apply category filter
          if (filters.categories.length > 0) {
            filtered = filtered.filter((p) => filters.categories.includes(p.category))
          }

          // Apply price filter
          filtered = filtered.filter(
            (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
          )

          // Apply rating filter
          if (filters.minRating > 0) {
            filtered = filtered.filter((p) => p.rating >= filters.minRating)
          }

          // Apply stock filter
          if (filters.inStockOnly) {
            filtered = filtered.filter((p) => p.stock > 0)
          }

          setProducts(filtered)
        }
      } catch (error) {
        console.error('[v0] Failed to load products:', error)
        toast.error('Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [searchQuery, sortBy, filters])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Products</h1>
          <p className="text-muted-foreground">
            {sortBy === 'relevance'
              ? 'Discover personalized products recommended just for you'
              : 'Discover products tailored to your preferences'}
          </p>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4 mb-8 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance (Recommended)</SelectItem>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar on desktop, hidden on mobile */}
          <div className="hidden lg:block">
            <FiltersSidebar
              categories={categories}
              onFilterChange={setFilters}
              isLoading={isLoading}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <ProductGrid products={products} isLoading={isLoading} />

            {/* Results Count */}
            <div className="mt-8 text-center text-muted-foreground">
              {!isLoading && <p>Showing {products.length} products</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
