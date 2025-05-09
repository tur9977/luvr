"use client"

import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostList } from "@/components/posts/PostList"
import { EventList } from "@/components/events/EventList"
import type { PostWithProfile } from "@/lib/types/database.types"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

const POSTS_PER_PAGE = 5

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()
  const router = useRouter()
  const { user } = useAuth()

  const handleTabChange = (value: string) => {
    if (value === "events") {
      router.push("/events")
    }
  }

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const from = page * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE - 1

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!inner (
            id,
            username,
            avatar_url,
            role
          ),
          post_media (
            id,
            media_url,
            media_type,
            aspect_ratio,
            duration,
            order
          ),
          likes(count),
          comments(
            id,
            content,
            created_at,
            profiles(
              id,
              username,
              avatar_url,
              role
            )
          ),
          shares(count)
        `)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (postsError) throw postsError

      // 獲取當前用戶的點讚狀態
      const { data: user } = await supabase.auth.getUser()
      let likedPosts: string[] = []

      if (user?.user) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.user.id)
          .in('post_id', postsData.map(post => post.id))

        likedPosts = likes?.map(like => like.post_id) || []
      }

      // 處理數據格式
      const formattedPosts = postsData.map(post => ({
        ...post,
        caption: post.caption ?? "",
        media_url: post.media_url ?? (post.post_media?.[0]?.media_url ?? ""),
        media_type: post.media_type ?? (post.post_media?.[0]?.media_type ?? "image"),
        aspect_ratio: post.aspect_ratio ?? (post.post_media?.[0]?.aspect_ratio ?? 1),
        has_liked: likedPosts.includes(post.id),
        _count: {
          likes: post.likes?.[0]?.count || 0,
          comments: post.comments?.length || 0,
          shares: post.shares?.[0]?.count || 0
        }
      }))

      if (formattedPosts.length < POSTS_PER_PAGE) {
        setHasMore(false)
      }

      // 使用 Map 來確保每個貼文 ID 只有一個最新的版本
      setPosts(prevPosts => {
        const postsMap = new Map()
        
        // 先加入現有的貼文
        prevPosts.forEach(post => {
          postsMap.set(post.id, post)
        })
        
        // 加入新的貼文，如果有相同 ID 的會覆蓋舊的
        formattedPosts.forEach(post => {
          postsMap.set(post.id, post)
        })
        
        // 轉換回陣列並保持原有順序
        return Array.from(postsMap.values())
      })
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [page])

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(prev => prev + 1)
    }
  }, [inView, hasMore, isLoading])

  return (
    <main className="container max-w-2xl mx-auto p-4 space-y-4">
      <Tabs defaultValue="feed" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">動態消息</TabsTrigger>
          <TabsTrigger value="events">活動</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="space-y-4 mt-4">
          <PostList posts={posts} currentUserId={user?.id} />
        </TabsContent>
        <TabsContent value="events" className="space-y-4 mt-4">
          <EventList />
        </TabsContent>
      </Tabs>
      
      {hasMore && (
        <div
          ref={ref}
          className="flex justify-center p-4"
        >
          {isLoading && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </main>
  )
}

