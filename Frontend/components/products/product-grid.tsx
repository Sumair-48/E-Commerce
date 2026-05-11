'use client'

import { Product } from '@/lib/types/product'
import { ProductCard } from './product-card'
import { Empty } from '@/components/ui/empty'
import { motion } from 'framer-motion'

interface ProductGridProps {
  products: Product[]
  isLoading?: boolean
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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

  if (!isLoading && products.length === 0) {
    return <Empty title="No products found" description="Try adjusting your filters" />
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  )
}
