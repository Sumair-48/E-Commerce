'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, ShoppingBag, Eye, MousePointerClick, Heart, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth'
import { toast } from 'sonner'

interface AdminAnalyticsData {
  daily_revenue: Array<{
    date: string
    orders: number
    revenue: number
  }>
  top_products: Array<{
    id: number
    name: string
    purchase_count: number
    revenue: number
  }>
}

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

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!token || !user?.is_admin) {
      router.push('/login')
      return
    }

    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        const [analyticsRes, dashboardRes] = await Promise.all([
          apiClient.get<AdminAnalyticsData>('/admin/analytics', { params: { days } }),
          apiClient.get<DashboardStats>('/admin/dashboard-stats'),
        ])

        setAnalyticsData(analyticsRes.data)
        setDashboardStats(dashboardRes.data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        toast.error('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [days, token, user, router])

  // Transform data for charts
  const userGrowthData = analyticsData?.daily_revenue.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    orders: item.orders,
    revenue: item.revenue,
  })) || []

  const topProductsData = analyticsData?.top_products.slice(0, 10).map((item) => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    purchases: item.purchase_count,
    revenue: item.revenue,
  })) || []

  const revenueByCategoryData = dashboardStats?.revenue_by_category.map((item) => ({
    name: item.name,
    revenue: item.revenue,
    orders: item.order_count,
  })) || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Detailed insights into user behavior and platform performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold">{dashboardStats?.total_users || 0}</p>
                <p className="text-xs text-green-600 mt-2">Active users</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{dashboardStats?.total_orders || 0}</p>
                <p className="text-xs text-green-600 mt-2">All time</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">${(dashboardStats?.total_revenue || 0).toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-2">All time</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                <p className="text-3xl font-bold">{dashboardStats?.total_products || 0}</p>
                <p className="text-xs text-green-600 mt-2">In catalog</p>
              </div>
              <Eye className="w-8 h-8 text-primary opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Revenue */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Daily Revenue (Last {days} Days)</h2>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-1 border border-border rounded-md text-sm"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Revenue" />
                <Area type="monotone" dataKey="orders" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Revenue by Category */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Revenue by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="orders" fill="#8b5cf6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Top Products (Last {days} Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="purchases" fill="#3b82f6" name="Purchases" />
              <Bar dataKey="revenue" fill="#ec4899" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
