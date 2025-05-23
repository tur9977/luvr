"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, Calendar } from "lucide-react"
import { UserNav } from "./user-nav"
import { useProfile } from "@/hooks/useProfile"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

// Vibrant and joyful logo design
const Logo = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 背景光暈效果 */}
    <circle cx="20" cy="20" r="20" fill="url(#backgroundGlow)" />

    {/* 主要圖形 */}
    <path
      d="M20 8C13.3726 8 8 13.3726 8 20C8 26.6274 13.3726 32 20 32C26.6274 32 32 26.6274 32 20C32 13.3726 26.6274 8 20 8ZM20 28C15.5817 28 12 24.4183 12 20C12 15.5817 15.5817 12 20 12C24.4183 12 28 15.5817 28 20C28 24.4183 24.4183 28 20 28Z"
      fill="#8A6FD4" // 更鮮艷的紫色
    />

    {/* 內圈動感曲線 */}
    <path
      d="M20 14C16.6863 14 14 16.6863 14 20C14 23.3137 16.6863 26 20 26C23.3137 26 26 23.3137 26 20C26 16.6863 23.3137 14 20 14ZM20 22C18.8954 22 18 21.1046 18 20C18 18.8954 18.8954 18 20 18C21.1046 18 22 18.8954 22 20C22 21.1046 21.1046 22 20 22Z"
      fill="#B4A5E5" // 較淺的紫色
    />

    {/* 光點裝飾 */}
    <circle cx="16" cy="16" r="1.5" fill="white" />
    <circle cx="24" cy="16" r="1" fill="white" />

    {/* 漸層定義 */}
    <defs>
      <radialGradient
        id="backgroundGlow"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(20 20) rotate(90) scale(20)"
      >
        <stop offset="0%" stopColor="#9F85DB" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
)

export function SiteHeader() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 transform hover:rotate-180 transition-transform duration-500">
            <Logo />
          </div>
          <span
            className="text-2xl font-black tracking-tight bg-gradient-to-br from-[#8A6FD4] via-[#9F85DB] to-[#B4A5E5] text-transparent bg-clip-text hover:scale-105 transition-transform duration-300"
            style={{
              textShadow: "0 2px 10px rgba(138, 111, 212, 0.2)",
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            LUVR
          </span>
        </Link>
        
        <div className="flex items-center ml-auto gap-2">
          {user && profile ? (
            <>
              <Link 
                href="/events" 
                aria-label="活動日曆"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link 
                href="/create" 
                aria-label="建立新內容"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <PlusCircle className="h-5 w-5" aria-hidden="true" />
              </Link>
              <UserNav />
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="mr-2"
              >
                <Link href="/auth/login" aria-label="登入">
                  登入
                </Link>
              </Button>
              <Button 
                size="sm" 
                className="bg-[#8A6FD4] hover:bg-[#7857C8]"
                asChild
              >
                <Link href="/auth/register" aria-label="註冊">
                  註冊
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

