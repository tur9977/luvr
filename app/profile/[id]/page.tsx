import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { PostActions } from "@/components/PostActions"
import type { Database } from "@/lib/types/database.types"
import type { Metadata } from "next"

interface Props {
  params: { id: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createServerComponentClient<Database>({ cookies })

  // 獲取用戶資料
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // 獲取用戶的貼文
  const { data: posts } = await supabase
    .from("posts")
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
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })

  // 獲取當前用戶是否對每個貼文按讚
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  let userLikes: string[] = []
  
  if (user && !userError) {
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
    
    userLikes = likes?.map(like => like.post_id) || []
  }

  // 處理貼文數據
  const formattedPosts = posts?.map(post => ({
    ...post,
    has_liked: userLikes.includes(post.id),
    _count: {
      likes: post.likes?.[0]?.count || 0,
      comments: post.comments?.length || 0,
      shares: post.shares?.[0]?.count || 0
    }
  })) || []

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <div className="flex flex-col items-center gap-6 py-8">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
          <AvatarFallback>
            {(profile.username || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{profile.username || "未設置用戶名"}</h1>
          {profile.full_name && (
            <p className="text-muted-foreground">{profile.full_name}</p>
          )}
          {profile.location && (
            <p className="text-sm text-muted-foreground mt-1">{profile.location}</p>
          )}
          {profile.bio && (
            <p className="mt-4 max-w-md">{profile.bio}</p>
          )}
        </div>
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold">{formattedPosts.length}</p>
            <p className="text-sm text-muted-foreground">貼文</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">粉絲</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">追蹤中</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">貼文</TabsTrigger>
          <TabsTrigger value="likes">按讚的貼文</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <div className="space-y-4">
            {formattedPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                還沒有任何貼文
              </div>
            ) : (
              formattedPosts.map((post) => (
                <Card key={post.id}>
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={post.profiles?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {(post.profiles?.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{post.profiles?.username || "未知用戶"}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                          {post.location && ` · ${post.location}`}
                        </p>
                      </div>
                    </div>
                    {post.caption && (
                      <p className="mt-4">{post.caption}</p>
                    )}
                  </div>
                  <div className="relative aspect-square">
                    {post.media_type === "video" ? (
                      <video
                        src={post.media_url}
                        poster={post.thumbnail_url || undefined}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={post.media_url}
                        alt={post.caption || "Post image"}
                        fill
                        className="object-cover"
                        priority={formattedPosts.indexOf(post) === 0}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <PostActions
                      postId={post.id}
                      userId={post.user_id}
                      initialLikesCount={post._count.likes}
                      initialCommentsCount={post._count.comments}
                      initialSharesCount={post._count.shares}
                      isLiked={post.has_liked}
                      initialComments={post.comments}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            此功能即將推出
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
} 