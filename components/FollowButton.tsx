"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import type { Database } from "@/lib/types/database.types"

export interface FollowButtonProps {
  targetUserId: string
  isFollowing: boolean
}

export function FollowButton({ targetUserId, isFollowing: initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const handleFollow = async () => {
    try {
      setIsLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("請先登入")
      }

      if (isFollowing) {
        // 取消追蹤
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)

        if (error) throw error
        toast.success("已取消追蹤")
      } else {
        // 追蹤
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })

        if (error) throw error
        toast.success("已追蹤")
      }

      setIsFollowing(!isFollowing)
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("操作失敗，請稍後再試")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isFollowing ? "取消追蹤" : "追蹤"}
    </Button>
  )
} 