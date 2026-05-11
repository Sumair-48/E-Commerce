'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth'
import { motion } from 'framer-motion'
import { Sparkles, Search, ShoppingCart, Zap } from 'lucide-react'

export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            ShopAI
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Create Account</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="container mx-auto px-4 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            AI-Powered Shopping{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Just For You
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Experience shopping like never before. Our intelligent recommendation engine learns your
            preferences and surfaces the perfect products tailored to your unique style and budget.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="text-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 mt-20">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
            <p className="text-muted-foreground">
              Our AI learns your preferences and recommends products you&apos;ll love
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Intelligent Search</h3>
            <p className="text-muted-foreground">
              Find exactly what you&apos;re looking for with smart filtering and sorting
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Personalized Cart</h3>
            <p className="text-muted-foreground">
              Get suggestions for complementary items while you shop
            </p>
          </Card>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="container mx-auto px-4 py-20"
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Card className="p-12 text-center bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <h2 className="text-3xl font-bold mb-4">Ready to shop smarter?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of users discovering products personalized to their taste.
          </p>
          {!isAuthenticated && (
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Start Shopping Today
              </Button>
            </Link>
          )}
        </Card>
      </motion.section>
    </div>
  )
}
