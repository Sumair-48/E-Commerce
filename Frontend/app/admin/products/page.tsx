'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  description?: string
  price: number
  category_id: number
  brand?: string
  stock: number
  image_url?: string
  rating: number
  purchase_count: number
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/admin/products?limit=100')
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to load products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await apiClient.delete(`/products/${id}`)
      setProducts(products.filter((p) => p.id !== id))
      toast.success('Product deleted successfully')
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Product Management</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Brand</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Sales</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded" />
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.brand || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-medium">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            product.stock > 10
                              ? 'bg-green-100 text-green-800'
                              : product.stock > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1">
                          ⭐ {product.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.purchase_count}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {!isLoading && filteredProducts.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>
    </div>
  )
}
