"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostList } from "@/components/posts/PostList"
import { useAuth } from "@/hooks/useAuth"
import type { PostWithProfile } from "@/lib/types/database.types"

interface ProfileContentProps {
  posts: PostWithProfile[]
  likedPosts: PostWithProfile[]
}

export function ProfileContent({ posts, likedPosts }: ProfileContentProps) {
  // Debug log for ProfileContent props
  console.log('[ProfileContent] posts:', posts)
  console.log('[ProfileContent] likedPosts:', likedPosts)
  const { user } = useAuth();
  return (
    <Tabs defaultValue="posts" className="w-full mt-8">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="posts">貼文</TabsTrigger>
        <TabsTrigger value="likes">按讚的貼文</TabsTrigger>
      </TabsList>
      <TabsContent value="posts" className="mt-6">
        <PostList posts={posts} currentUserId={user?.id} />
      </TabsContent>
      <TabsContent value="likes" className="mt-6">
        <PostList posts={likedPosts} currentUserId={user?.id} />
      </TabsContent>
    </Tabs>
  )
} 