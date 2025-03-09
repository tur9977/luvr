"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const menuItems = [
  {
    title: "儀表板",
    href: "/admin",
    icon: "📊"
  },
  {
    title: "用戶管理",
    href: "/admin/users",
    icon: "👥"
  },
  {
    title: "內容審核",
    href: "/admin/contents",
    icon: "📝"
  },
  {
    title: "報告處理",
    href: "/admin/reports",
    icon: "🚨"
  },
  {
    title: "系統設置",
    href: "/admin/settings",
    icon: "⚙️"
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* 桌面版側邊欄 */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-gray-100/40 dark:bg-gray-800/40">
        <div className="p-6">
          <h2 className="text-lg font-semibold">管理員後台</h2>
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid gap-1 px-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  pathname === item.href && "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                )}
              >
                <span>{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* 手機版側邊欄 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="lg:hidden px-0 w-12">
            <Menu className="h-6 w-6" />
            <span className="sr-only">打開選單</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6">
            <h2 className="text-lg font-semibold">管理員後台</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <nav className="grid gap-1 px-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                    pathname === item.href && "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                  )}
                >
                  <span>{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 主要內容區域 */}
      <main className="flex-1 flex flex-col">
        <div className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
          <div className="lg:hidden">
            <Button variant="ghost" className="px-0 w-12" onClick={() => setOpen(true)}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">打開選單</span>
            </Button>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {menuItems.find(item => item.href === pathname)?.title || "管理員後台"}
            </h1>
          </div>
        </div>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  )
} 