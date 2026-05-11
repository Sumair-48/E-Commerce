'use client'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Settings, BarChart3, Package, ShoppingBag, Users, LogOut, Home } from 'lucide-react'
import { toast } from 'sonner'

export function AdminNavbar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    document.cookie = 'auth-token=; path=/; max-age=0'
    document.cookie = 'onboarding-completed=; path=/; max-age=0'
    router.push('/')
    toast.success('Logged out successfully')
  }

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/admin/dashboard" className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            ShopAI Admin
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/admin/orders" className="text-sm font-medium hover:text-primary transition-colors">
              Orders
            </Link>
            <Link href="/admin/users" className="text-sm font-medium hover:text-primary transition-colors">
              Users
            </Link>
            <Link href="/admin/analytics" className="text-sm font-medium hover:text-primary transition-colors">
              Analytics
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Store
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {user?.name || 'Admin'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Quick Links</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="cursor-pointer">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/analytics" className="cursor-pointer">
                  <Package className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
