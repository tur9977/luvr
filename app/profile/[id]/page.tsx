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
import { FollowButton } from "@/components/FollowButton"
import type { Database } from "@/lib/types/database.types"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { UserAvatar } from "@/components/ui/user-avatar"

const MediaGallery = dynamic(() => import("@/components/MediaGallery"), {
  ssr: false,
})

interface Props {
  params: { id: string }
}

interface PostMedia {
  id: string
  media_url: string
  media_type: string
  aspect_ratio: number
  duration: number | null
  order: number
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
      profiles!inner (
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
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })

  // 獲取當前用戶是否對每個貼文按讚
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  let userLikes: string[] = []
  let isFollowing = false
  
  if (user && !userError) {
    const [{ data: likes }, { data: followData }] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id),
      supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", params.id)
        .maybeSingle()
    ])
    
    userLikes = likes?.map(like => like.post_id) || []
    isFollowing = !!followData
  }

  // 獲取關注者和正在關注的數量
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: 'exact', head: true })
      .eq("following_id", params.id),
    supabase
      .from("follows")
      .select("*", { count: 'exact', head: true })
      .eq("follower_id", params.id)
  ])

  // 處理貼文數據
  const formattedPosts = posts?.map(post => ({
    ...post,
    profiles: post.profiles as {
      id: string
      username: string | null
      avatar_url: string | null
    },
    has_liked: userLikes.includes(post.id),
    _count: {
      likes: post.likes?.[0]?.count || 0,
      comments: post.comments?.length || 0,
      shares: post.shares?.[0]?.count || 0
    }
  })) || []

  // 獲取用戶按讚的貼文
  const { data: likedPosts } = await supabase
    .from("likes")
    .select(`
      post_id,
      posts!inner (
        *,
        profiles!inner (
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
        )
      )
    `)
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })

  // 處理按讚貼文的數據
  const formattedLikedPosts = likedPosts?.map(like => {
    const post = like.posts as any
    return {
      ...post,
      profiles: post.profiles as {
        id: string
        username: string | null
        avatar_url: string | null
      },
      has_liked: true,
      _count: {
        likes: 0, // 需要單獨獲取
        comments: 0,
        shares: 0
      }
    }
  }) || []

  // 獲取按讚貼文的統計數據
  if (formattedLikedPosts.length > 0) {
    const postIds = formattedLikedPosts.map(post => post.id)
    const [likesData, commentsData, sharesData] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id", { count: "exact" })
        .in("post_id", postIds),
      supabase
        .from("comments")
        .select("post_id", { count: "exact" })
        .in("post_id", postIds),
      supabase
        .from("shares")
        .select("post_id", { count: "exact" })
        .in("post_id", postIds)
    ])

    // 更新統計數據
    formattedLikedPosts.forEach(post => {
      post._count.likes = likesData.count || 0
      post._count.comments = commentsData.count || 0
      post._count.shares = sharesData.count || 0
    })
  }

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <div className="flex flex-col items-center gap-6 py-8">
        <UserAvatar 
          username={profile.username}
          avatarUrl={profile.avatar_url}
          role={profile.role}
          size="lg"
          className="h-32 w-32"
        />
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
          {user && user.id !== params.id && (
            <div className="mt-4">
              <FollowButton userId={params.id} initialIsFollowing={isFollowing} />
            </div>
          )}
        </div>
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold">{formattedPosts.length}</p>
            <p className="text-sm text-muted-foreground">貼文</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{followersCount || 0}</p>
            <p className="text-sm text-muted-foreground">粉絲</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{followingCount || 0}</p>
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
                  {post.post_media && post.post_media.length > 0 && (
                    <MediaGallery media={post.post_media} caption={post.caption} priority={formattedPosts.indexOf(post) === 0} />
                  )}
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
          <div className="space-y-4">
            {formattedLikedPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                還沒有按讚的貼文
              </div>
            ) : (
              formattedLikedPosts.map((post) => (
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
                  {post.post_media && post.post_media.length > 0 && (
                    <MediaGallery media={post.post_media} caption={post.caption} priority={formattedLikedPosts.indexOf(post) === 0} />
                  )}
                  <div className="p-4">
                    <PostActions
                      postId={post.id}
                      userId={post.user_id}
                      initialLikesCount={post._count.likes}
                      initialCommentsCount={post._count.comments}
                      initialSharesCount={post._count.shares}
                      isLiked={post.has_liked}
                      initialComments={[]}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
} 