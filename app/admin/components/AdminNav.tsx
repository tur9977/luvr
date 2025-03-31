"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  AlertTriangle,
  Users,
  FileText,
  BarChart,
  Calendar
} from "lucide-react"

const navItems = [
  {
    title: "總覽",
    href: "/admin",
    icon: <BarChart className="h-4 w-4" />
  },
  {
    title: "檢舉管理",
    href: "/admin/reports",
    icon: <AlertTriangle className="h-4 w-4" />
  },
  {
    title: "用戶管理",
    href: "/admin/users",
    icon: <Users className="h-4 w-4" />
  },
  {
    title: "貼文管理",
    href: "/admin/posts",
    icon: <FileText className="h-4 w-4" />
  },
  {
    title: "活動管理",
    href: "/admin/events",
    icon: <Calendar className="h-4 w-4" />
  }
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === item.href
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 