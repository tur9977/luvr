"use client"

import { PostCard } from "./PostCard"
import type { PostWithProfile } from "@/lib/types/database.types"

interface PostListProps {
  posts: PostWithProfile[]
  currentUserId?: string
}

export function PostList({ posts, currentUserId }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        還沒有任何貼文
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  )
} 