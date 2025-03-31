"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BadgeCheck, Crown, Shield, Star } from "lucide-react"
import type { ProfileRole } from "@/lib/types/database.types"

interface UserAvatarProps {
  username: string
  avatarUrl: string | null
  role: ProfileRole
  className?: string
  size?: "sm" | "md" | "lg"
  showBadge?: boolean
}

export function UserAvatar({ 
  username, 
  avatarUrl, 
  role = "user", 
  className, 
  size = "md",
  showBadge = false 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  }

  const badgeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  const getBadgeIcon = (role: ProfileRole) => {
    switch (role) {
      case 'admin':
        return <Crown className={cn(badgeClasses[size], "text-purple-500")} />
      case 'user':
        return <BadgeCheck className={cn(badgeClasses[size], "text-blue-500")} />
      case 'banned':
        return <Shield className={cn(badgeClasses[size], "text-red-500")} />
      default:
        return null
    }
  }

  const badgeIcon = getBadgeIcon(role)

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage 
          src={avatarUrl || undefined} 
          alt={username}
          className="object-cover"
          style={{ width: "100%", height: "100%" }}
        />
        <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      {badgeIcon && (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
          {badgeIcon}
        </div>
      )}
      {showBadge && (role === 'admin' || role === 'banned') && (
        <Badge 
          variant={role === 'admin' ? "secondary" : "destructive"} 
          className="absolute -top-2 -right-2 text-xs px-1 py-0"
        >
          {role === 'admin' ? '管理員' : '已封鎖'}
        </Badge>
      )}
    </div>
  )
} 