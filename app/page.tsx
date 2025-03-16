import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/types/database.types"
import { PostList } from "@/components/posts/PostList"
import type { PostWithProfile } from "@/components/posts/PostCard"
import { EventList } from "@/components/events/EventList"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPosts(): Promise<PostWithProfile[]> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!fk_posts_profiles (
          id,
          username,
          avatar_url
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

    // 獲取當前用戶是否對每個貼文按讚
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (user && !userError) {
      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)

      const likedPostIds = new Set(userLikes?.map(like => like.post_id))
      
      posts.forEach(post => {
        post.has_liked = likedPostIds.has(post.id)
        post._count = {
          likes: post.likes?.[0]?.count || 0,
          comments: post.comments?.length || 0,
          shares: post.shares?.[0]?.count || 0
        }
      })
    } else {
      posts.forEach(post => {
        post.has_liked = false
        post._count = {
          likes: post.likes?.[0]?.count || 0,
          comments: post.comments?.length || 0,
          shares: post.shares?.[0]?.count || 0
        }
      })
    }

    return posts as PostWithProfile[]
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

