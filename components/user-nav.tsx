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
import { useEffect, useState } from "react"
import { UserAvatar } from "@/components/ui/user-avatar"

export function UserNav() {
  const { profile } = useProfile()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (profile) {
        console.log("Checking admin status for user:", {
          id: profile.id,
          username: profile.username,
          role: profile.role
        })

        // 直接從數據庫檢查角色
        const { data: dbProfile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', profile.id)
          .single()
          
        if (!error && dbProfile?.role === 'admin') {
          console.log('User confirmed as admin')
          setIsAdmin(true)
        } else {
          console.log('User is not admin:', { error, role: dbProfile?.role })
          setIsAdmin(false)
        }
      }
    }

    checkAdminStatus()
  }, [profile])

  if (!profile) return null

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // 使用完整頁面刷新
      window.location.href = '/auth/login'
    } catch (error) {
      console.error("登出失敗:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar 
            username={profile.username}
            avatarUrl={profile.avatar_url}
            role={profile.role}
            size="sm"
          />
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
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                後台管理
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 