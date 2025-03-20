"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProfile } from "@/hooks/useProfile"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProfileSettingsDialog } from "./profile-settings-dialog"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export function UserNav() {
  const { profile } = useProfile()
  const router = useRouter()

  useEffect(() => {
    if (profile) {
      console.log("User profile:", {
        id: profile.id,
        username: profile.username,
        role: profile.role
      })
    }
  }, [profile])

  if (!profile) return null

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // 使用 window.location.href 進行頁面跳轉
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("登出失敗:", error)
    }
  }

  const isAdmin = profile.role === 'admin'
  console.log("Is admin?", isAdmin)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 overflow-hidden">
            <AvatarImage 
              src={profile.avatar_url || "/placeholder.svg"} 
              alt={profile.username || ''} 
              className="object-cover"
            />
            <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.username || "未設置用戶名"}
            </p>
            {profile.full_name && (
              <p className="text-xs leading-none text-muted-foreground">
                {profile.full_name}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${profile.id}`} className="cursor-pointer">
            個人主頁
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/create" className="cursor-pointer">
            發布貼文
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ProfileSettingsDialog profile={profile}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            設定
          </DropdownMenuItem>
        </ProfileSettingsDialog>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              後台管理
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-100"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 