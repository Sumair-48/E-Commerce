'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import apiClient from '@/lib/api/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Category {
  id: number
  name: string
}

export default function NewAdminProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    brand: '',
    stock: '',
    image_url: '',
  })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.get<Category[]>('/categories')
        setCategories(response.data)
      } catch {
        toast.error('Failed to load categories')
      }
    }
    loadCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category_id || !form.stock) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      await apiClient.post('/products', {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        category_id: Number(form.category_id),
        brand: form.brand || null,
        image_url: form.image_url || null,
        stock: Number(form.stock),
        tags: [],
        features: {},
      })
      toast.success('Product added successfully')
      router.push('/admin/products')
    } catch (error) {
      console.error('Failed to add product:', error)
      toast.error('Failed to add product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-2">Add Product</h1>
          <p className="text-muted-foreground mb-6">Create a new product in your catalog</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the product"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="99.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={form.category_id}
                onValueChange={(value) => setForm({ ...form, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Brand name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Adding Product...' : 'Add Product'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
