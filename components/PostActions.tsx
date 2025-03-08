"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { Comment } from "@/lib/types/database.types"

interface PostActionsProps {
  postId: string
  initialLikesCount: number
  initialCommentsCount: number
  initialSharesCount: number
  isLiked: boolean
  initialComments?: Comment[]
}

export function PostActions({
  postId,
  initialLikesCount,
  initialCommentsCount,
  initialSharesCount,
  isLiked,
  initialComments = [],
}: PostActionsProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [sharesCount, setSharesCount] = useState(initialSharesCount)
  const [liked, setLiked] = useState(isLiked)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)

  // 當初始評論改變時更新狀態
  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  // 處理按讚
  const handleLike = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能按讚",
      })
      return
    }

    try {
      if (liked) {
        // 取消按讚
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)

        if (error) throw error

        setLikesCount((prev) => prev - 1)
        setLiked(false)
      } else {
        // 按讚
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id })

        if (error) throw error

        setLikesCount((prev) => prev + 1)
        setLiked(true)
      }
    } catch (error) {
      console.error("按讚操作失敗:", error)
      toast({
        variant: "destructive",
        title: "操作失敗",
        description: "請稍後再試",
      })
    }
  }

  // 載入評論
  const loadComments = async () => {
    if (!isCommentsOpen || comments.length > 0) return

    try {
      setIsLoadingComments(true)
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setComments(data || [])
    } catch (error) {
      console.error("載入評論失敗:", error)
      toast({
        variant: "destructive",
        title: "載入評論失敗",
        description: "請稍後再試",
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  // 發表評論
  const handleComment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能發表評論",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        variant: "destructive",
        title: "請輸入評論內容",
        description: "評論內容不能為空",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      setComments((prev) => [data, ...prev])
      setCommentsCount((prev) => prev + 1)
      setNewComment("")
    } catch (error) {
      console.error("發表評論失敗:", error)
      toast({
        variant: "destructive",
        title: "發表評論失敗",
        description: "請稍後再試",
      })
    }
  }

  // 分享貼文
  const handleShare = async () => {
    try {
      // 創建分享記錄
      const { error } = await supabase
        .from("shares")
        .insert({ post_id: postId, user_id: user?.id })

      if (error) throw error

      setSharesCount((prev) => prev + 1)

      // 使用 Web Share API
      if (navigator.share) {
        await navigator.share({
          title: "分享貼文",
          text: "查看這則有趣的貼文",
          url: `${window.location.origin}/post/${postId}`,
        })
      } else {
        // 如果不支援 Web Share API，則複製連結
        await navigator.clipboard.writeText(
          `${window.location.origin}/post/${postId}`
        )
        toast({
          title: "連結已複製",
          description: "貼文連結已複製到剪貼簿",
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // 用戶取消分享
        return
      }
      console.error("分享失敗:", error)
      toast({
        variant: "destructive",
        title: "分享失敗",
        description: "請稍後再試",
      })
    }
  }

  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLike}
          className={liked ? "text-red-500" : ""}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          {likesCount > 0 && (
            <span className="ml-2 text-sm">{likesCount}</span>
          )}
        </Button>

        <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsCommentsOpen(true)
                loadComments()
              }}
            >
              <MessageCircle className="h-5 w-5" />
              {commentsCount > 0 && (
                <span className="ml-2 text-sm">{commentsCount}</span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>評論</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 my-4">
              {isLoadingComments ? (
                <div className="text-center text-muted-foreground">
                  載入評論中...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  還沒有評論
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar>
                      <AvatarImage
                        src={comment.profiles?.avatar_url || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {(comment.profiles?.username || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {comment.profiles?.username || "未知用戶"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Textarea
                placeholder="發表評論..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleComment}>發送</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
          {sharesCount > 0 && (
            <span className="ml-2 text-sm">{sharesCount}</span>
          )}
        </Button>
      </div>
    </div>
  )
} 