import { AdminNavbar } from '@/components/admin/admin-navbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminNavbar />
      {children}
    </>
  )
}
