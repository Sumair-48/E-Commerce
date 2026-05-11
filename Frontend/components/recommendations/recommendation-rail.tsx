'use client'

import { RecommendedProduct } from '@/lib/types/product'
import { RecommendationCard } from './recommendation-card'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef } from 'react'

interface RecommendationRailProps {
  title: string
  subtitle?: string
  products: RecommendedProduct[]
  isLoading?: boolean
}

export function RecommendationRail({
  title,
  subtitle,
  products,
  isLoading,
}: RecommendationRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex gap-2 hidden sm:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="h-10 w-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="h-10 w-10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-72 snap-start"
            >
              <RecommendationCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
