'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Minus, Plus, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cart'
import { motion, AnimatePresence } from 'framer-motion'

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore()

  const total = getTotal()
  const itemCount = getItemCount()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {itemCount}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {itemCount === 0 ? 'Your cart is empty' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button asChild onClick={() => setIsOpen(false)}>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.product_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 py-4 border-b"
                  >
                    {/* Image */}
                    <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={item.image_url || '/placeholder.jpg'}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product_id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-sm font-bold mb-3">${item.price.toFixed(2)}</p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
              <Button className="w-full" size="lg" asChild onClick={() => setIsOpen(false)}>
                <Link href="/checkout">Checkout</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
                asChild
              >
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
