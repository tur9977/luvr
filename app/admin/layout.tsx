import { AdminAuthCheck } from "./auth-check"
import { AdminNav } from "./components/AdminNav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminAuthCheck />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">後台管理</h1>
        <div className="grid grid-cols-[200px_1fr] gap-6">
          <AdminNav />
          <main>{children}</main>
        </div>
      </div>
    </>
  )
} 