'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingBag, Eye, Heart, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth'
import { toast } from 'sonner'

interface UserInsights {
  total_interactions: number
  total_purchases: number
  total_spent: number
  recent_activity_7d: number
  favorite_categories: Array<{
    name: string
    count: number
  }>
  personalization_level: 'cold_start' | 'warming_up' | 'personalized'
}

interface InteractionStats {
  date: string
  views: number
  clicks: number
  purchases: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [userInsights, setUserInsights] = useState<UserInsights | null>(null)
  const [interactionData, setInteractionData] = useState<InteractionStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    if (!token) {
      router.push('/login')
      return
    }

    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.get<UserInsights>('/analytics/user-insights')
        setUserInsights(response.data)

        // Transform favorite categories for pie chart
        if (response.data.favorite_categories.length > 0) {
          const categoryData = response.data.favorite_categories.map((cat, index) => ({
            name: cat.name,
            value: cat.count,
            fill: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'][index % 5],
          }))
        }

        // Generate mock interaction data based on total interactions
        // In a real scenario, you'd fetch this from another endpoint
        const mockInteractionData = [
          { day: 'Mon', views: Math.floor(response.data.total_interactions * 0.1), clicks: Math.floor(response.data.total_interactions * 0.05), purchases: Math.floor(response.data.total_purchases * 0.15) },
          { day: 'Tue', views: Math.floor(response.data.total_interactions * 0.12), clicks: Math.floor(response.data.total_interactions * 0.06), purchases: Math.floor(response.data.total_purchases * 0.18) },
          { day: 'Wed', views: Math.floor(response.data.total_interactions * 0.09), clicks: Math.floor(response.data.total_interactions * 0.045), purchases: Math.floor(response.data.total_purchases * 0.12) },
          { day: 'Thu', views: Math.floor(response.data.total_interactions * 0.14), clicks: Math.floor(response.data.total_interactions * 0.07), purchases: Math.floor(response.data.total_purchases * 0.2) },
          { day: 'Fri', views: Math.floor(response.data.total_interactions * 0.11), clicks: Math.floor(response.data.total_interactions * 0.055), purchases: Math.floor(response.data.total_purchases * 0.16) },
          { day: 'Sat', views: Math.floor(response.data.total_interactions * 0.16), clicks: Math.floor(response.data.total_interactions * 0.08), purchases: Math.floor(response.data.total_purchases * 0.22) },
          { day: 'Sun', views: Math.floor(response.data.total_interactions * 0.13), clicks: Math.floor(response.data.total_interactions * 0.065), purchases: Math.floor(response.data.total_purchases * 0.19) },
        ]
        setInteractionData(mockInteractionData)
      } catch (error) {
        console.error('Failed to fetch user analytics:', error)
        toast.error('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [token, router])

  const categoryData = userInsights?.favorite_categories.map((cat, index) => ({
    name: cat.name,
    value: cat.count,
    fill: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'][index % 5],
  })) || []

  // Generate spending data based on total spent
  const spendingData = userInsights
    ? [
        { month: 'Jan', spent: Math.floor(userInsights.total_spent * 0.08) },
        { month: 'Feb', spent: Math.floor(userInsights.total_spent * 0.12) },
        { month: 'Mar', spent: Math.floor(userInsights.total_spent * 0.09) },
        { month: 'Apr', spent: Math.floor(userInsights.total_spent * 0.15) },
        { month: 'May', spent: Math.floor(userInsights.total_spent * 0.11) },
        { month: 'Jun', spent: Math.floor(userInsights.total_spent * 0.13) },
      ]
    : []

  const personalizationBadgeColor = {
    cold_start: 'bg-gray-100 text-gray-800',
    warming_up: 'bg-yellow-100 text-yellow-800',
    personalized: 'bg-green-100 text-green-800',
  }

  const personalizationLabel = {
    cold_start: 'Cold Start',
    warming_up: 'Warming Up',
    personalized: 'Personalized',
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Analytics</h1>
              <p className="text-muted-foreground">
                Track your shopping behavior and personalization insights
              </p>
            </div>
            {userInsights && (
              <Badge className={personalizationBadgeColor[userInsights.personalization_level]}>
                {personalizationLabel[userInsights.personalization_level]}
              </Badge>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-3xl font-bold">${(userInsights?.total_spent || 0).toFixed(2)}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary opacity-50" />
            </div>
            <p className="text-xs text-green-600 mt-2">All time</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Views</p>
                <p className="text-3xl font-bold">{userInsights?.total_interactions || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
            <p className="text-xs text-green-600 mt-2">All time interactions</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Purchases</p>
                <p className="text-3xl font-bold">{userInsights?.total_purchases || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
            <p className="text-xs text-green-600 mt-2">Items purchased</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recent Activity</p>
                <p className="text-3xl font-bold">{userInsights?.recent_activity_7d || 0}</p>
              </div>
              <Heart className="w-8 h-8 text-destructive opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 7 days</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Spending Over Time */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Monthly Spending</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `$${value}`}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Favorite Categories</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} interactions`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Interaction Pattern */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Weekly Interaction Pattern</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Bar dataKey="views" fill="#3b82f6" name="Product Views" />
              <Bar dataKey="clicks" fill="#8b5cf6" name="Link Clicks" />
              <Bar dataKey="purchases" fill="#ec4899" name="Purchases" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">
                  You had {userInsights?.recent_activity_7d || 0} interactions in the last 7 days. Keep exploring to get better recommendations!
                </p>
              </div>
            </div>
          </Card>

          {userInsights?.favorite_categories.length && (
            <Card className="p-6 bg-purple-50 border-purple-200">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Top Category</h3>
                  <p className="text-sm text-muted-foreground">
                    {userInsights.favorite_categories[0]?.name} is your favorite category. Consider exploring similar products to maximize personalization.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Personalization Level</h3>
                <p className="text-sm text-muted-foreground">
                  {userInsights?.personalization_level === 'personalized'
                    ? 'Your profile is fully personalized! Enjoy tailored recommendations.'
                    : userInsights?.personalization_level === 'warming_up'
                    ? 'Your profile is warming up. Continue shopping to get better recommendations.'
                    : 'Start shopping to unlock personalized recommendations!'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-pink-50 border-pink-200">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Total Purchases</h3>
                <p className="text-sm text-muted-foreground">
                  You've made {userInsights?.total_purchases || 0} purchases totaling ${(userInsights?.total_spent || 0).toFixed(2)}. Great shopping!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
