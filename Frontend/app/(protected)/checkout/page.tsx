'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/lib/store/cart'
import { useAuthStore } from '@/lib/store/auth'
import { trackingService } from '@/lib/utils/tracking'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Package, CreditCard, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const user = useAuthStore((state) => state.user)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const total = getTotal()
  const shipping = 10
  const tax = Math.round(total * 0.1 * 100) / 100
  const grandTotal = total + shipping + tax

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Button variant="outline" asChild className="mb-8">
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some products before checking out
            </p>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order has been confirmed.
              </p>
            </div>

            <Card className="p-4 bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="text-xl font-bold font-mono">#ORD-{Date.now().toString().slice(-8)}</p>
            </Card>

            <div className="text-left space-y-2">
              <p className="text-sm"><span className="font-medium">Total:</span> ${grandTotal.toFixed(2)}</p>
              <p className="text-sm"><span className="font-medium">Shipping:</span> Standard (5-7 business days)</p>
            </div>

            <div className="pt-4 space-y-3">
              <Button className="w-full" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Track purchase
      trackingService.trackPurchase(grandTotal)

      clearCart()
      setOrderPlaced(true)
      toast.success('Order placed successfully!')

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error) {
      console.error('[v0] Checkout error:', error)
      toast.error('Failed to place order')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <Button variant="outline" asChild className="mb-8">
          <Link href="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Review
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product_id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image_url || '/placeholder.jpg'}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                      <p className="font-bold mt-1">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder={user?.name?.split(' ')[0]}
                      defaultValue={user?.name?.split(' ')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder={user?.name?.split(' ')[1] || ''}
                      defaultValue={user?.name?.split(' ')[1] || ''}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={user?.email}
                    defaultValue={user?.email}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" placeholder="123 Main St" required />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="New York" required />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="NY" required />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="10001" required />
                  </div>
                </div>
              </form>
            </Card>

            {/* Payment Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h2>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input id="cardName" placeholder="John Doe" required />
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="4532 1234 5678 9010"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="MM/YY" maxLength={5} required />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" maxLength={4} required />
                  </div>
                  <div>
                    <Label htmlFor="zip2">ZIP Code</Label>
                    <Input id="zip2" placeholder="10001" required />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="terms" defaultChecked />
                  <Label htmlFor="terms" className="font-normal cursor-pointer">
                    I agree to the terms and conditions
                  </Label>
                </div>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </Button>

              <Button variant="outline" size="lg" className="w-full mt-3" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                This is a demo. Use test card: 4532 1234 5678 9010
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
