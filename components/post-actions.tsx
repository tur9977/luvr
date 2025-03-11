"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useProfile } from "@/hooks/useProfile"
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
import Link from "next/link"

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface CommentResponse {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface PostActionsProps {
  postId: string
  initialLikesCount: number
  initialCommentsCount: number
  initialSharesCount: number
  isLiked: boolean
}

export function PostActions({
  postId,
  initialLikesCount = 0,
  initialCommentsCount = 0,
  initialSharesCount = 0,
  isLiked = false,
}: PostActionsProps) {
  const { toast } = useToast()
  const { profile } = useProfile()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [sharesCount, setSharesCount] = useState(initialSharesCount)
  const [hasLiked, setHasLiked] = useState(isLiked)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)

  // 處理按讚
  const handleLike = async () => {
    if (!profile) {
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能按讚",
      })
      return
    }

    try {
      if (hasLiked) {
        // 取消讚
        const { error } = await supabase
          .from("likes")
          .delete()
          .match({ post_id: postId, user_id: profile.id })

        if (error) throw error

        setLikesCount((prev) => prev - 1)
        setHasLiked(false)
      } else {
        // 添加讚
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: profile.id })

        if (error) throw error

        setLikesCount((prev) => prev + 1)
        setHasLiked(true)
      }
    } catch (error) {
      console.error("處理按讚時出錯:", error)
      toast({
        variant: "destructive",
        title: "操作失敗",
        description: "處理按讚時出錯，請稍後再試",
      })
    }
  }

  // 載入留言
  const loadComments = async () => {
    if (!isCommentsOpen) return

    try {
      setIsLoadingComments(true)
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          profiles!fk_posts_profiles (
            username,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .returns<CommentResponse[]>()

      if (error) throw error

      // 轉換數據格式以匹配 Comment 接口
      const formattedComments = (data || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        profiles: comment.profiles ? {
          username: comment.profiles.username,
          avatar_url: comment.profiles.avatar_url
        } : {
          username: '匿名用戶',
          avatar_url: null
        }
      }))

      setComments(formattedComments)
    } catch (error) {
      console.error("載入留言時出錯:", error)
      toast({
        variant: "destructive",
        title: "載入失敗",
        description: "載入留言時出錯，請稍後再試",
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  // 提交留言
  const handleComment = async () => {
    if (!profile) {
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能留言",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        variant: "destructive",
        title: "留言不能為空",
        description: "請輸入留言內容",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: profile.id,
          content: newComment.trim(),
        })
        .select(`
          id,
          content,
          created_at,
          profiles!fk_posts_profiles (
            username,
            avatar_url
          )
        `)
        .single()
        .returns<CommentResponse>()

      if (error) throw error

      // 轉換數據格式以匹配 Comment 接口
      const formattedComment: Comment = {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        profiles: {
          username: data.profiles.username,
          avatar_url: data.profiles.avatar_url
        }
      }

      setComments(prev => [formattedComment, ...prev])
      setCommentsCount(prev => prev + 1)
      setNewComment("")
    } catch (error) {
      console.error("提交留言時出錯:", error)
      toast({
        variant: "destructive",
        title: "提交失敗",
        description: "提交留言時出錯，請稍後再試",
      })
    }
  }

  // 處理分享
  const handleShare = async () => {
    if (!profile) {
      toast({
        variant: "destructive",
        title: "請先登入",
        description: "您需要登入才能分享",
      })
      return
    }

    try {
      // 首先嘗試複製貼文連結
      await navigator.clipboard.writeText(
        `${window.location.origin}/posts/${postId}`
      )

      // 記錄分享動作
      const { error } = await supabase
        .from("shares")
        .insert({ post_id: postId, user_id: profile.id })

      if (error) throw error

      setSharesCount((prev) => prev + 1)
      toast({
        title: "分享成功",
        description: "貼文連結已複製到剪貼簿",
      })
    } catch (error) {
      console.error("分享時出錯:", error)
      toast({
        variant: "destructive",
        title: "分享失敗",
        description: "分享時出錯，請稍後再試",
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLike}
          className={hasLiked ? "text-red-500" : ""}
        >
          <Heart className={`h-5 w-5 ${hasLiked ? "fill-current" : ""}`} />
        </Button>
        <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" onClick={loadComments}>
              <MessageCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>留言</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="寫下你的留言..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleComment}>發送</Button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {isLoadingComments ? (
                  <div className="text-center text-muted-foreground">
                    載入中...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    還沒有任何留言
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={comment.profiles?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {comment.profiles?.username?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${comment.profiles?.username || 'anonymous'}`}
                            className="text-sm font-semibold hover:underline"
                          >
                            {comment.profiles?.username || '匿名用戶'}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: zhTW,
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
      <div className="px-2 space-y-1">
        <p className="text-sm font-semibold">{likesCount} 個讚</p>
        {commentsCount > 0 && (
          <button
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => setIsCommentsOpen(true)}
          >
            查看全部 {commentsCount} 則留言
          </button>
        )}
      </div>
    </div>
  )
} 