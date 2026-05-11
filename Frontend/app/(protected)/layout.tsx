import { TopNavbar } from '@/components/layout/top-navbar'
import { Footer } from '@/components/layout/footer'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopNavbar />
      {children}
      <Footer />
    </>
  )
}
