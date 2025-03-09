import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays } from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { Database } from "@/lib/types/database.types"
import { PostActions } from "@/components/PostActions"

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Post = Database['public']['Tables']['posts']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  }
}

interface PostWithProfile extends Post {
  profiles: Profile
  _count?: {
    likes: number
    comments: number
    shares: number
  }
  has_liked?: boolean
  comments?: Comment[]
}

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
          {posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              還沒有任何貼文
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <Avatar>
                    <AvatarImage src={post.profiles?.avatar_url || '/placeholder.svg'} />
                    <AvatarFallback>
                      {(post.profiles?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Link 
                      href={`/profile/${post.user_id}`} 
                      className="text-sm font-semibold hover:underline"
                    >
                      {post.profiles?.username || '未知用戶'}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: zhTW,
                      })}
                      {post.location && ` · ${post.location}`}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {post.media_type === "video" ? (
                    <div className="relative aspect-square">
                      <video
                        src={post.media_url}
                        poster={post.thumbnail_url || undefined}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-square">
                      <NextImage
                        src={post.media_url}
                        alt={post.caption || "Post image"}
                        fill
                        className="object-cover"
                        priority={posts.indexOf(post) === 0}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  {post.caption && (
                    <div className="p-4">
                      <p className="text-sm">{post.caption}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between p-2">
                  <PostActions
                    postId={post.id}
                    userId={post.user_id}
                    initialLikesCount={post._count?.likes || 0}
                    initialCommentsCount={post._count?.comments || 0}
                    initialSharesCount={post._count?.shares || 0}
                    isLiked={post.has_liked || false}
                    initialComments={post.comments || []}
                  />
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4 mt-4">
          {/* Event Card */}
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <NextImage
                  src="/placeholder.svg"
                  alt="Event cover"
                  width={600}
                  height={200}
                  className="w-full object-cover h-48"
                />
                <div className="absolute top-4 left-4 bg-background/90 rounded-lg p-2 backdrop-blur">
                  <p className="text-sm font-semibold">台北同志遊行</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    2024年10月28日
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm">一年一度的台北同志遊行即將展開！讓我們一起為平等與愛發聲。</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">我要參加</Button>
                  <Button variant="outline" size="sm">
                    了解更多
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <NextImage
                  src="/placeholder.svg"
                  alt="Event cover"
                  width={600}
                  height={200}
                  className="w-full object-cover h-48"
                />
                <div className="absolute top-4 left-4 bg-background/90 rounded-lg p-2 backdrop-blur">
                  <p className="text-sm font-semibold">女同志電影放映會</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    2024年9月15日
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm">一起來欣賞獲獎女同志電影，映後將有導演座談會。</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">我要參加</Button>
                  <Button variant="outline" size="sm">
                    了解更多
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

