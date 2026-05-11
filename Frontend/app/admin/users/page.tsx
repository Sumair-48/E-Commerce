'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Mail, Calendar } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { toast } from 'sonner'

interface User {
  id: number
  email: string
  username: string
  onboarding_completed: boolean
  preferences?: {
    categories: string[]
    budget_range: [number, number]
    interests: string[]
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/admin/users?limit=100')
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage and view all users</p>
        </div>

        {/* Search */}
        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or username..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Username</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Categories</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Budget</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{user.username}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.onboarding_completed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {user.onboarding_completed ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.preferences?.categories.length || 0} categories
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.preferences?.budget_range
                          ? `$${user.preferences.budget_range[0]} - $${user.preferences.budget_range[1]}`
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {!isLoading && filteredUsers.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  )
}
