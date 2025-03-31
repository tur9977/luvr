"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { PostActions } from "@/components/PostActions"
import MediaGallery from "@/components/MediaGallery"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { PostWithProfile } from "@/lib/types/database.types"
import type { ProfileRole } from "@/lib/types/supabase"

interface PostMedia {
  id: string
  media_url: string
  media_type: string
  aspect_ratio: number
  duration: number | null
  order: number
}

interface ProfileContentProps {
  posts: PostWithProfile[]
  likedPosts: PostWithProfile[]
}

export function ProfileContent({ posts, likedPosts }: ProfileContentProps) {
  return (
    <Tabs defaultValue="posts" className="w-full mt-8">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="posts">貼文</TabsTrigger>
        <TabsTrigger value="likes">按讚的貼文</TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-6">
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              還沒有任何貼文
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      username={post.profiles.username || ""}
                      avatarUrl={post.profiles.avatar_url || ""}
                      role={post.profiles.role as ProfileRole}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold">{post.profiles.username || "未知用戶"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </p>
                    </div>
                  </div>
                  {post.caption && (
                    <p className="mt-4">{post.caption}</p>
                  )}
                </div>
                {post.post_media && post.post_media.length > 0 && (
                  <MediaGallery 
                    media={post.post_media.map(media => ({
                      ...media,
                      duration: media.duration || null
                    }))} 
                    caption={post.caption} 
                    priority={posts.indexOf(post) === 0} 
                  />
                )}
                <div className="p-4">
                  <PostActions
                    postId={post.id}
                    userId={post.user_id}
                    initialLikesCount={post._count?.likes || 0}
                    initialCommentsCount={post._count?.comments || 0}
                    initialSharesCount={post._count?.shares || 0}
                    isLiked={post.has_liked || false}
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
          {likedPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              還沒有按讚的貼文
            </div>
          ) : (
            likedPosts.map((post) => (
              <Card key={post.id}>
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      username={post.profiles.username || ""}
                      avatarUrl={post.profiles.avatar_url || ""}
                      role={post.profiles.role as ProfileRole}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold">{post.profiles.username || "未知用戶"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </p>
                    </div>
                  </div>
                  {post.caption && (
                    <p className="mt-4">{post.caption}</p>
                  )}
                </div>
                {post.post_media && post.post_media.length > 0 && (
                  <MediaGallery 
                    media={post.post_media.map(media => ({
                      ...media,
                      duration: media.duration || null
                    }))} 
                    caption={post.caption} 
                    priority={likedPosts.indexOf(post) === 0} 
                  />
                )}
                <div className="p-4">
                  <PostActions
                    postId={post.id}
                    userId={post.user_id}
                    initialLikesCount={post._count?.likes || 0}
                    initialCommentsCount={post._count?.comments || 0}
                    initialSharesCount={post._count?.shares || 0}
                    isLiked={post.has_liked || false}
                    initialComments={post.comments}
                  />
                </div>
              </Card>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
} 