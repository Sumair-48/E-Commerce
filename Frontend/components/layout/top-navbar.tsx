'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { Sparkles, Home, ShoppingBag, Heart, User, LogOut, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWishlistStore } from '@/lib/store/wishlist'

export function TopNavbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const wishlistItems = useWishlistStore((state) => state.items)

  const handleLogout = () => {
    logout()
    document.cookie = 'auth-token=; path=/; max-age=0'
    document.cookie = 'onboarding-completed=; path=/; max-age=0'
    router.push('/')
    toast.success('Logged out successfully')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <Sparkles className="w-6 h-6 text-primary" />
          <span>ShopAI</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Products
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Wishlist Link */}
          <Link href="/wishlist">
            <Button variant="outline" size="icon" className="relative">
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Button>
          </Link>

          {/* Cart Drawer */}
          <CartDrawer />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/products" className="cursor-pointer">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Products
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wishlist" className="cursor-pointer">
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlist
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/analytics" className="cursor-pointer">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
