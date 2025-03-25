import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { BadgeCheck, Crown, Shield, Star, User } from "lucide-react"
import type { ProfileRole } from "@/lib/types/supabase"

interface UserAvatarProps {
  username?: string | null
  avatarUrl?: string | null
  role?: ProfileRole
  className?: string
  size?: "sm" | "md" | "lg"
}

export function UserAvatar({ 
  username, 
  avatarUrl, 
  role,
  className,
  size = "md"
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

  const getBadgeIcon = (role?: ProfileRole) => {
    switch (role) {
      case 'admin':
        return <Crown className={cn(badgeClasses[size], "text-purple-500")} />
      case 'verified_user':
        return <BadgeCheck className={cn(badgeClasses[size], "text-blue-500")} />
      case 'brand_user':
        return <Star className={cn(badgeClasses[size], "text-yellow-500")} />
      case 'banned_user':
        return <Shield className={cn(badgeClasses[size], "text-red-500")} />
      default:
        return null
    }
  }

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={avatarUrl || '/placeholder.svg'} alt={username || 'User avatar'} />
        <AvatarFallback>
          {username?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      {role && role !== 'normal_user' && (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
          {getBadgeIcon(role)}
        </div>
      )}
    </div>
  )
} 