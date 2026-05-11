import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our AI-curated product collection',
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
