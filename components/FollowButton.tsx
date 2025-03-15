"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useProfile } from "@/hooks/useProfile"

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
}

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { profile } = useProfile()
  const supabase = createClientComponentClient()

  const handleFollow = async () => {
    if (!profile) {
      toast.error('請先登入')
      return
    }

    if (profile.id === userId) {
      toast.error('不能關注自己')
      return
    }

    setIsLoading(true)

    try {
      if (isFollowing) {
        // 取消關注
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', profile.id)
          .eq('following_id', userId)

        if (error) throw error

        toast.success('已取消關注')
      } else {
        // 添加關注
        const { error } = await supabase
          .from('follows')
          .insert([
            {
              follower_id: profile.id,
              following_id: userId
            }
          ])

        if (error) {
          if (error.code === '23505') {
            toast.error('您已經關注了這個用戶')
          } else {
            throw error
          }
          return
        }

        toast.success('已關注')
      }

      setIsFollowing(!isFollowing)
      router.refresh()
    } catch (error) {
      console.error('關注操作失敗:', error)
      toast.error('操作失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-28"
    >
      {isFollowing ? "取消關注" : "關注"}
    </Button>
  )
} 