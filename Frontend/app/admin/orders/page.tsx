'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'

interface Order {
  id: number
  user_id: number
  product_id: number
  quantity: number
  price_paid: number
  purchased_at: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/admin/orders?limit=100')
      setOrders(response.data)
    } catch (error) {
      console.error('Failed to load orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toString().includes(searchTerm) ||
      order.user_id.toString().includes(searchTerm) ||
      order.product_id.toString().includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">View and manage all orders</p>
        </div>

        {/* Search */}
        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, user ID, or product ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">User ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium">#{order.id}</td>
                      <td className="px-6 py-4 text-sm">{order.user_id}</td>
                      <td className="px-6 py-4 text-sm">{order.product_id}</td>
                      <td className="px-6 py-4 text-sm">{order.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium">${order.price_paid.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.purchased_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {!isLoading && filteredOrders.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        )}
      </div>
    </div>
  )
}
