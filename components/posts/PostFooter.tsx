"use client"

import { CardFooter } from "@/components/ui/card"
import { PostActions } from "@/components/PostActions"
import type { PostWithProfile } from "./PostCard"

interface PostFooterProps {
  post: PostWithProfile
}

export function PostFooter({ post }: PostFooterProps) {
  return (
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
  )
} 