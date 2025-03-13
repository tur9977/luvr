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
import { MoreHorizontal, Flag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { toast } from "sonner"
import { useState } from "react"
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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', profile?.id)

      if (error) throw error

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
          <Avatar>
            <AvatarImage src={post.profiles.avatar_url || '/placeholder.svg'} />
            <AvatarFallback>
              {post.profiles.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/u/${post.profiles.username}`}
              className="text-sm font-medium hover:underline"
            >
              {post.profiles.username}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: zhTW
              })}
            </p>
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