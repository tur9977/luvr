"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Flag, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useProfile } from "@/hooks/useProfile"
import type { PostWithProfile } from "./PostCard"

interface PostHeaderProps {
  post: PostWithProfile
}

export function PostHeader({ post }: PostHeaderProps) {
  const router = useRouter()
  const { profile } = useProfile()
  const supabase = createClientComponentClient()
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeAgo, setTimeAgo] = useState("")

  useEffect(() => {
    // 初始化時間顯示
    setTimeAgo(formatDistanceToNow(new Date(post.created_at), {
      addSuffix: true,
      locale: zhTW
    }))

    // 每分鐘更新一次時間顯示
    const timer = setInterval(() => {
      setTimeAgo(formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: zhTW
      }))
    }, 60000)

    return () => clearInterval(timer)
  }, [post.created_at])

  const handleDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("請先登入")
        return
      }

      // 檢查是否有權限刪除貼文
      if (user.id !== post.user_id) {
        toast.error("您沒有權限刪除這則貼文")
        return
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('刪除貼文時出錯:', error)
        toast.error('刪除貼文失敗')
        return
      }

      toast.success('已刪除貼文')
      router.refresh()
    } catch (error) {
      console.error('刪除貼文時出錯:', error)
      toast.error('刪除貼文失敗')
    }
  }

  const handleReport = async () => {
    if (!profile) {
      toast.error('請先登入')
      return
    }

    if (!reportReason.trim()) {
      toast.error('請填寫檢舉原因')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Submitting report with data:', {
        reported_content_id: post.id,
        reporter_id: profile.id,
        reason: reportReason.trim(),
        status: 'pending'
      })

      // 嘗試插入資料
      const { error: insertError } = await supabase
        .from('reports')
        .insert([{
          reported_content_id: post.id,
          reporter_id: profile.id,
          reason: reportReason.trim(),
          status: 'pending'
        }])

      if (insertError) {
        console.error('插入檢舉記錄時出錯:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
        
        if (insertError.code === '23505') {
          toast.error('您已經檢舉過這則貼文')
        } else if (insertError.code === '23503') {
          toast.error('無法檢舉不存在的貼文')
        } else {
          toast.error(`檢舉失敗: ${insertError.message}`)
        }
        return
      }

      toast.success('已送出檢舉，我們會盡快處理')
      setShowReportDialog(false)
      setReportReason("")
    } catch (error) {
      console.error('檢舉過程中出錯:', error)
      toast.error('檢舉失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user_id}`} className="hover:opacity-75">
            <Avatar>
              <AvatarImage 
                src={post.profiles.avatar_url || '/placeholder.svg'} 
                className="w-full h-full object-cover"
              />
              <AvatarFallback>
                {post.profiles.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={`/profile/${post.user_id}`}
              className="text-sm font-medium hover:underline"
            >
              {post.profiles.username}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground leading-none">
              {post.location && (
                <div className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  <span>{post.location}</span>
                </div>
              )}
              <span className="leading-none">·</span>
              <span>{timeAgo || "剛剛"}</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">更多選項</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {profile?.id === post.user_id ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                刪除貼文
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag className="mr-2 h-4 w-4" />
                檢舉貼文
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>檢舉貼文</DialogTitle>
            <DialogDescription>
              請說明您檢舉這則貼文的原因，我們會盡快審核。
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="請詳細說明檢舉原因..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              onClick={handleReport}
              disabled={isSubmitting}
            >
              送出檢舉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 