"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreVertical, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { formatDistanceToNow } from "date-fns"
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
  const { user, checkPermission } = useAuth()
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
    if (!user || !checkPermission('write:posts')) {
      toast({
        variant: "destructive",
        title: "無法執行操作",
        description: "您可能需要登入或帳號已被封禁",
      })
      return
    }

    try {
      // 先檢查是否已經按讚
      const { data: existingLike } = await supabase
        .from("likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single()

      if (existingLike) {
        // 已經按讚，執行取消按讚
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)

        if (error) throw error

        setLikesCount((prev) => prev - 1)
        setLiked(false)
      } else {
        // 尚未按讚，執行按讚
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
    if (!user || !checkPermission('write:posts')) {
      toast({
        variant: "destructive",
        title: "無法執行操作",
        description: "您可能需要登入或帳號已被封禁",
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

  // 刪除評論
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "無法執行操作",
        description: "您需要登入才能刪除評論",
      })
      return
    }
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id)

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
    if (!user) {
      toast({
        variant: "destructive",
        title: "無法執行操作",
        description: "您需要登入才能刪除貼文",
      })
      return
    }
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "刪除成功",
        description: "貼文已刪除",
      })

      // 重新整理頁面
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
    if (!user) {
      toast({
        variant: "destructive",
        title: "無法執行操作",
        description: "您需要登入才能分享貼文",
      })
      return
    }
    try {
      // 創建分享記錄
      const { error } = await supabase
        .from("shares")
        .insert({ post_id: postId, user_id: user.id })

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
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        className={cn(
          "flex items-center gap-2 h-9 px-4",
          liked && "text-red-500"
        )}
        onClick={handleLike}
      >
        <Heart className={cn("h-5 w-5", liked && "fill-current")} />
        <span className="text-sm">{likesCount}</span>
      </Button>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-9 px-4"
            onClick={() => {
              setIsCommentsOpen(true)
              loadComments()
            }}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">{commentsCount}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
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
                      className="w-full h-full object-cover"
                    />
                    <AvatarFallback>
                      {(comment.profiles?.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
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
                      {(user?.id === comment.user_id || isPostOwner) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedCommentId(comment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確定要刪除這則評論嗎？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作無法復原。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                刪除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 mt-4">
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

      <Button
        variant="ghost"
        className="flex items-center gap-2 h-9 px-4"
        onClick={handleShare}
      >
        <Share2 className="h-5 w-5" />
        <span className="text-sm">{sharesCount}</span>
      </Button>

      {isPostOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="ml-auto">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除這則貼文嗎？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作將會永久刪除貼文及其所有評論、按讚和分享記錄。此操作無法復原。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePost}
                className="bg-red-500 hover:bg-red-600"
              >
                刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
} 