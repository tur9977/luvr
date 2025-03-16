"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProfile } from "@/hooks/useProfile"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Database } from "@/lib/types/database.types"
import { Loader2, MessageSquare, ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Comment = {
  id: string
  event_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles: {
    avatar_url: string | null
    full_name: string | null
    username: string | null
  }
}

interface EventCommentsProps {
  eventId: string
  comments: Comment[]
}

const MAX_COMMENT_LENGTH = 500

export function EventComments({ eventId, comments: initialComments }: EventCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const { profile } = useProfile()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) {
      toast.error("請先登入")
      return
    }
    if (!content.trim()) {
      toast.error("請輸入評論內容")
      return
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      toast.error(`評論內容不能超過 ${MAX_COMMENT_LENGTH} 個字`)
      return
    }

    setIsSubmitting(true)
    try {
      const { data: newComment, error: insertError } = await supabase
        .from("event_comments")
        .insert({
          event_id: eventId,
          user_id: profile.id,
          content: content.trim(),
        })
        .select()
        .single()

      if (insertError) throw insertError

      const commentWithProfile = {
        ...newComment,
        profiles: {
          avatar_url: profile.avatar_url,
          full_name: profile.full_name,
          username: profile.username
        }
      }

      setComments((prev) => [commentWithProfile, ...prev])
      setContent("")
      toast.success("評論已發布")
    } catch (error) {
      console.error("Error posting comment:", error)
      toast.error("發布評論失敗")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("event_comments")
        .delete()
        .eq("id", commentId)

      if (error) throw error

      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      toast.success("評論已刪除")
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("刪除評論失敗")
    }
  }

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB
  })

  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "oldest")
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="分享你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{content.length} / {MAX_COMMENT_LENGTH}</span>
            <Button type="submit" disabled={isSubmitting || content.length > MAX_COMMENT_LENGTH}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  發布中...
                </>
              ) : (
                "發布評論"
              )}
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">{comments.length} 則評論</span>
          </div>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  最新評論
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  最早評論
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>還沒有評論，來發表第一則評論吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedComments.map((comment) => (
              <div key={comment.id} className="flex space-x-4 animate-in fade-in-50">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.profiles.avatar_url || ""} />
                      <AvatarFallback>
                        {comment.profiles.full_name?.[0] || comment.profiles.username?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <Avatar>
                        <AvatarImage src={comment.profiles.avatar_url || ""} />
                        <AvatarFallback>
                          {comment.profiles.full_name?.[0] || comment.profiles.username?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">
                          {comment.profiles.full_name || comment.profiles.username}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">
                        {comment.profiles.full_name || comment.profiles.username}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                    </div>
                    {profile?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                      >
                        刪除
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 