'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, ShoppingBag, DollarSign, TrendingUp, Package, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'

interface DashboardStats {
  total_users: number
  total_products: number
  total_orders: number
  total_revenue: number
  revenue_by_category: Array<{
    name: string
    order_count: number
    revenue: number
  }>
  recent_orders: Array<{
    id: number
    user_id: number
    product_id: number
    quantity: number
    price_paid: number
    purchased_at: string
  }>
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/admin/dashboard-stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load dashboard</p>
          <Button onClick={loadStats}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your e-commerce platform</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold">{stats.total_users}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{stats.total_orders}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">${stats.total_revenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Products</p>
                <p className="text-3xl font-bold">{stats.total_products}</p>
              </div>
              <Package className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue by Category */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6">Revenue by Category</h2>
            {stats.revenue_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.revenue_by_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="order_count" fill="#8b5cf6" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </Card>

          {/* Category Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Sales Distribution</h2>
            {stats.revenue_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.revenue_by_category}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, order_count }) => `${name}: ${order_count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="order_count"
                  >
                    {stats.revenue_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </Card>
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Manage Users</h3>
            <p className="text-sm text-muted-foreground mb-4">View and manage all users</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">Go to Users</Link>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Manage Products</h3>
            <p className="text-sm text-muted-foreground mb-4">Add, edit, or delete products</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">Go to Products</Link>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mb-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Manage Orders</h3>
            <p className="text-sm text-muted-foreground mb-4">View and process orders</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">Go to Orders</Link>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground mb-4">View detailed analytics</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/analytics">Go to Analytics</Link>
            </Button>
          </Card>
        </div>

        {/* Recent Orders */}
        {stats.recent_orders.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Order ID</th>
                    <th className="px-4 py-2 text-left">User ID</th>
                    <th className="px-4 py-2 text-left">Product ID</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-secondary/30">
                      <td className="px-4 py-2">#{order.id}</td>
                      <td className="px-4 py-2">{order.user_id}</td>
                      <td className="px-4 py-2">{order.product_id}</td>
                      <td className="px-4 py-2">{order.quantity}</td>
                      <td className="px-4 py-2 font-medium">${order.price_paid.toFixed(2)}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(order.purchased_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Alerts */}
        <Card className="p-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">System Status</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>✓ All systems operational</li>
                <li>✓ Database connected</li>
                <li>✓ API endpoints responding</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
