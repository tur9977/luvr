"use client"

import { PostCard, PostWithProfile } from "./PostCard"

interface PostListProps {
  posts: PostWithProfile[]
}

export function PostList({ posts }: PostListProps) {
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
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
} 