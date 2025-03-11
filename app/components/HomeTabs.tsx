"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import NextImage from "next/image"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { ReportButton } from "./ReportButton"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Heart, MessageCircle, Share } from "lucide-react"

type Post = {
  id: string
  created_at: string
  caption: string | null
  location: string | null
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url: string | null
  user_id: string
}

type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
}

type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
}

interface HomeTabsProps {
  posts: (Post & {
    profiles: Profile
    likes: { id: string, user_id: string }[]
    comments: (Comment & {
      profiles: Profile
    })[]
    shares: { id: string }[]
  })[]
  currentUser: Profile | null
}

export function HomeTabs({ posts: initialPosts, currentUser }: HomeTabsProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [commentText, setCommentText] = useState("")
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [posts, setPosts] = useState(initialPosts)
  const supabase = createClient()

  useEffect(() => {
    if (currentUser) {
      const userLikedPosts = new Set(
        posts
          .filter(post => post.likes.some(like => like.user_id === currentUser.id))
          .map(post => post.id)
      )
      setLikedPosts(userLikedPosts)
    }
  }, [posts, currentUser])

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast.error("請先登入")
      return
    }

    try {
      if (likedPosts.has(postId)) {
        // 取消按讚
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id)

        if (error) throw error
        
        // 更新本地狀態
        setLikedPosts(prev => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })
        
        // 更新帖子列表中的讚數
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes.filter(like => like.user_id !== currentUser.id) }
            : post
        ))
        
        toast.success("已取消按讚")
      } else {
        // 按讚
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: currentUser.id })

        if (error) throw error
        
        // 更新本地狀態
        setLikedPosts(prev => new Set([...prev, postId]))
        
        // 更新帖子列表中的讚數
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: [...post.likes, { id: Date.now().toString(), user_id: currentUser.id }] }
            : post
        ))
        
        toast.success("已按讚")
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error("操作失敗")
    }
  }

  const handleComment = async () => {
    if (!currentUser || !selectedPost) {
      toast.error("請先登入")
      return
    }

    if (!commentText.trim()) {
      toast.error("請輸入留言內容")
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: selectedPost,
          user_id: currentUser.id,
          content: commentText.trim()
        })
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      // 更新本地評論列表
      setPosts(prev => prev.map(post => 
        post.id === selectedPost 
          ? { 
              ...post, 
              comments: [
                {
                  id: data.id,
                  post_id: data.post_id,
                  user_id: data.user_id,
                  content: data.content,
                  created_at: data.created_at,
                  profiles: data.profiles
                },
                ...post.comments
              ]
            }
          : post
      ))

      toast.success("留言已發布")
      setCommentText("")
      setSelectedPost(null)
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error("留言發布失敗")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async (postId: string) => {
    if (!currentUser) {
      toast.error("請先登入")
      return
    }

    try {
      // 獲取當前頁面的完整 URL
      const postUrl = `${window.location.origin}/posts/${postId}`
      
      // 創建分享選項
      const shareOptions = {
        title: '分享貼文',
        text: '查看這篇貼文',
        url: postUrl
      }

      // 檢查是否支持 Web Share API
      if (navigator.share) {
        await navigator.share(shareOptions)
      } else {
        // 如果不支持 Web Share API，則複製連結
        await navigator.clipboard.writeText(postUrl)
        toast.success("連結已複製到剪貼簿")
      }

      // 記錄分享動作
      const { error } = await supabase
        .from('shares')
        .insert({ post_id: postId, user_id: currentUser.id })

      if (error) throw error

      // 更新本地分享數
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, shares: [...post.shares, { id: Date.now().toString() }] }
          : post
      ))

      toast.success("已分享")
    } catch (error) {
      console.error('Error sharing post:', error)
      toast.error("分享失敗")
    }
  }

  return (
    <Tabs defaultValue="feed" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="feed">動態消息</TabsTrigger>
        <TabsTrigger value="events">活動</TabsTrigger>
      </TabsList>
      <TabsContent value="feed">
        {posts?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">目前還沒有任何動態</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts?.map((post) => (
              <Card key={post.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={post.profiles.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{post.profiles.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/users/${post.profiles.id}`} className="font-semibold hover:underline">
                        {post.profiles.username}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: zhTW
                        })}
                      </p>
                    </div>
                  </div>
                  {currentUser && currentUser.id !== post.user_id && (
                    <ReportButton contentId={post.id} userId={currentUser.id} />
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-gray-700">{post.caption}</p>
                  {post.media_type === 'image' && (
                    <div className="mt-4 relative aspect-video">
                      <NextImage
                        src={post.media_url}
                        alt="Post image"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {post.media_type === 'video' && (
                    <div className="mt-4">
                      <video
                        src={post.media_url}
                        poster={post.thumbnail_url || undefined}
                        controls
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={likedPosts.has(post.id) ? "text-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                    {post.likes?.length || 0}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedPost(post.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.comments?.length || 0}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>留言</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[60vh] overflow-y-auto space-y-4">
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.profiles?.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback>{comment.profiles?.username?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Link href={`/users/${comment.profiles?.id || comment.user_id}`} className="text-sm font-semibold hover:underline">
                                  {comment.profiles?.username || '匿名用戶'}
                                </Link>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(comment.created_at), {
                                    addSuffix: true,
                                    locale: zhTW
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {currentUser && (
                        <div className="mt-4 space-y-4">
                          <Textarea
                            placeholder="寫下您的想法..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPost(null)
                                setCommentText("")
                              }}
                              disabled={isSubmitting}
                            >
                              取消
                            </Button>
                            <Button
                              onClick={handleComment}
                              disabled={isSubmitting}
                            >
                              發布
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleShare(post.id)}
                  >
                    <Share className="h-4 w-4 mr-1" />
                    {post.shares?.length || 0}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="events">
        <div className="text-center py-8">
          <p className="text-gray-500">活動功能即將推出</p>
        </div>
      </TabsContent>
    </Tabs>
  )
} 