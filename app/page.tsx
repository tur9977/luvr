import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Heart, MessageCircle, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { Database } from "@/lib/types/database.types"

export const revalidate = 0

type Post = Database['public']['Tables']['posts']['Row']
type User = Database['public']['Tables']['users']['Row']

interface PostWithUser extends Post {
  users: User
  user: {
    id: string
    username: string
    avatar_url: string
  }
}

async function getPosts(): Promise<PostWithUser[]> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    console.log('開始獲取貼文...')
    
    // 首先獲取所有貼文
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('獲取貼文時出錯:', postsError.message)
      return []
    }

    if (!posts || posts.length === 0) {
      console.log('沒有找到任何貼文')
      return []
    }

    console.log('成功獲取貼文:', posts)

    // 然後獲取所有用戶
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      console.error('獲取用戶時出錯:', usersError.message)
      return []
    }

    console.log('成功獲取用戶:', users)

    // 手動關聯貼文和用戶數據
    const formattedPosts = posts.map(post => {
      const postUser = users?.find(user => user.id === post.user_id)
      return {
        ...post,
        users: postUser || null,
        user: {
          id: post.user_id,
          username: postUser?.username || '未知用戶',
          avatar_url: postUser?.avatar_url || '/placeholder.svg'
        }
      }
    }) as PostWithUser[]

    console.log('格式化後的貼文:', formattedPosts)
    return formattedPosts
  } catch (error) {
    console.error('獲取貼文時發生異常:', error)
    return []
  }
}

export default async function Home() {
  const posts = await getPosts()
  console.log('首頁組件中的貼文:', posts)

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
                    <AvatarImage src={post.user.avatar_url} />
                    <AvatarFallback>
                      {post.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Link 
                      href={`/profile/${post.user_id}`} 
                      className="text-sm font-semibold hover:underline"
                    >
                      {post.user.username}
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
                      <Image
                        src={post.media_url}
                        alt="Post image"
                        fill
                        className="object-cover"
                        priority={false}
                        loading="lazy"
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
                  <div className="flex gap-4">
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
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
                <Image
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
                <Image
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

