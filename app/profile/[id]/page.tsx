import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { UserAvatar } from "@/components/ui/user-avatar"
import { FollowButton } from "@/components/FollowButton"
import type { Database } from "@/lib/types/database.types"
import { ProfileContent } from "./profile-content"

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
      role: string
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
        role: string
      },
      has_liked: true,
      _count: {
        likes: post.likes?.[0]?.count || 0,
        comments: post.comments?.length || 0,
        shares: post.shares?.[0]?.count || 0
      }
    }
  }) || []

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <div className="flex flex-col items-center gap-6 py-8">
        <UserAvatar 
          username={profile.username || ""}
          avatarUrl={profile.avatar_url || ""}
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
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{formattedPosts.length}</p>
            <p className="text-sm text-muted-foreground">貼文</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{followersCount}</p>
            <p className="text-sm text-muted-foreground">粉絲</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{followingCount}</p>
            <p className="text-sm text-muted-foreground">追蹤中</p>
          </div>
        </div>
        {user?.id !== params.id && (
          <FollowButton
            targetUserId={params.id}
            isFollowing={isFollowing}
          />
        )}
      </div>

      <ProfileContent 
        posts={formattedPosts} 
        likedPosts={formattedLikedPosts} 
      />
    </main>
  )
} 