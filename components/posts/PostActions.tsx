"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreVertical, Trash2 } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow, parseISO, isValid } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useRouter } from "next/navigation"
import type { PostComment } from "@/lib/types/database.types"
import { cn } from "@/lib/utils"

interface PostActionsProps {
  postId: string
  userId: string
  initialLikesCount: number
  initialCommentsCount: number
  initialSharesCount: number
  isLiked: boolean
  initialComments?: PostComment[]
}

export function PostActions({
  postId,
  userId,
  initialLikesCount,
  initialCommentsCount,
  initialSharesCount,
  isLiked,
  initialComments = [],
}: PostActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [sharesCount, setSharesCount] = useState(initialSharesCount)
  const [liked, setLiked] = useState(isLiked)
  const [comments, setComments] = useState<PostComment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)

  const isPostOwner = user?.id === userId

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
            avatar_url,
            role
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
            avatar_url,
            role
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

  // 刪除評論
  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id)

      if (error) throw error

      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      setCommentsCount((prev) => prev - 1)
      setSelectedCommentId(null)

      toast({
        title: "刪除成功",
        description: "評論已刪除",
      })
    } catch (error) {
      console.error("刪除評論失敗:", error)
      toast({
        variant: "destructive",
        title: "刪除失敗",
        description: "請稍後再試",
      })
    }
  }

  // 刪除貼文
  const handleDeletePost = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user?.id)

      if (error) throw error

      toast({
        title: "刪除成功",
        description: "貼文已刪除",
      })

      router.refresh()
    } catch (error) {
      console.error("刪除貼文失敗:", error)
      toast({
        variant: "destructive",
        title: "刪除失敗",
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLike}
          className={liked ? "text-red-500" : ""}
        >
          <Heart className={cn("h-5 w-5", liked && "fill-current")} />
        </Button>
        <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" onClick={loadComments}>
              <MessageCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>評論</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="發表評論..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleComment}>發送</Button>
              </div>
              <div className="space-y-4">
                {isLoadingComments ? (
                  <div className="text-center py-4 text-muted-foreground">
                    載入中...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    還沒有評論
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={comment.profiles?.avatar_url || undefined}
                          alt={comment.profiles?.username || ""}
                        />
                        <AvatarFallback>
                          {(comment.profiles?.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {comment.profiles?.username || "未知用戶"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              try {
                                if (!comment.created_at) return "未知時間"
                                const date = parseISO(comment.created_at)
                                if (!isValid(date)) return "無效日期"
                                return formatDistanceToNow(date, {
                                  addSuffix: true,
                                  locale: zhTW,
                                })
                              } catch (error) {
                                console.error("時間格式化錯誤:", error)
                                return "未知時間"
                              }
                            })()}
                          </p>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                      {(user?.id === comment.user_id || isPostOwner) && (
                        <AlertDialog
                          open={selectedCommentId === comment.id}
                          onOpenChange={(open) =>
                            setSelectedCommentId(open ? comment.id : null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確定要刪除評論嗎？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作無法撤銷。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                確定
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
        {isPostOwner && (
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確定要刪除貼文嗎？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作無法撤銷。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePost}>
                  確定
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{likesCount} 個讚</p>
        <p className="text-sm text-muted-foreground">
          {commentsCount} 則評論 · {sharesCount} 次分享
        </p>
      </div>
    </div>
  )
}