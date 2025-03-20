import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types/database.types"
import { PostList } from "@/components/posts/PostList"
import type { PostWithProfile } from "@/components/posts/PostCard"
import { EventList } from "@/components/events/EventList"

interface PostMedia {
  id: string
  media_url: string
  media_type: "image" | "video"
  aspect_ratio: number
  duration?: number | null
  order: number
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPosts(): Promise<PostWithProfile[]> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // 首先獲取貼文數據
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!fk_posts_profiles (
          id,
          username,
          avatar_url
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
            avatar_url
          )
        ),
        shares(count)
      `)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('獲取貼文時出錯:', postsError.message)
      return []
    }

    if (!posts || posts.length === 0) {
      return []
    }

    let userLikedPosts = new Set<string>()
    
    try {
      // 嘗試獲取用戶會話
      const { data: { session } } = await supabase.auth.getSession()
      
      // 如果有會話，則獲取用戶的讚
      if (session?.user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', session.user.id)
        
        userLikedPosts = new Set(userLikes?.map(like => like.post_id) || [])
      }
    } catch (error) {
      console.error('獲取用戶會話時出錯:', error)
      // 繼續處理貼文，但不包含用戶特定的數據
    }

    // 處理每個貼文
    const processedPosts = posts.map(post => {
      return {
        ...post,
        media_type: post.media_type || (post.media_url?.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'),
        aspect_ratio: post.aspect_ratio || 1,
        has_liked: userLikedPosts.has(post.id),
        post_media: (post.post_media as PostMedia[] | null)?.sort((a, b) => a.order - b.order) || [],
        _count: {
          likes: post.likes?.[0]?.count || 0,
          comments: post.comments?.length || 0,
          shares: post.shares?.[0]?.count || 0
        }
      }
    })

    return processedPosts as PostWithProfile[]
  } catch (error) {
    console.error('獲取貼文時發生異常:', error)
    return []
  }
}

export default async function Home() {
  const posts = await getPosts()

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">動態消息</TabsTrigger>
          <TabsTrigger value="events">活動</TabsTrigger>
        </TabsList>
        <TabsContent value="feed" className="space-y-4 mt-4">
          <PostList posts={posts} />
        </TabsContent>
        <TabsContent value="events" className="space-y-4 mt-4">
          <EventList />
        </TabsContent>
      </Tabs>
    </main>
  )
}

