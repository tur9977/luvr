"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PostHeader } from "./PostHeader"
import { PostContent } from "./PostContent"
import { PostFooter } from "./PostFooter"
import type { Database } from "@/lib/types/database.types"

interface PostMedia {
  id: string
  media_url: string
  media_type: "image" | "video"
  aspect_ratio: number
  duration?: number | null
  order: number
}

interface PostComment {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

type Post = {
  id: string
  user_id: string
  media_url: string
  media_type: "image" | "video"
  thumbnail_url: string | null
  aspect_ratio: number
  duration?: number | null
  caption: string | null
  location: string | null
  created_at: string
  updated_at: string
  post_media?: PostMedia[]
}

type Profile = {
  username: string
  avatar_url: string | null
}

export interface PostWithProfile extends Post {
  profiles: Profile
  _count?: {
    likes: number
    comments: number
    shares: number
  }
  has_liked?: boolean
  comments?: PostComment[]
}

interface PostCardProps {
  post: PostWithProfile
}

export function PostCard({ post }: PostCardProps) {
  const mediaItems = post.post_media && post.post_media.length > 0
    ? post.post_media.sort((a, b) => a.order - b.order)
    : [{
        id: post.id,
        media_url: post.media_url,
        media_type: post.media_type,
        aspect_ratio: post.aspect_ratio,
        duration: post.duration,
        order: 0
      }]

  return (
    <Card>
      <PostHeader post={post} />
      {post.caption && (
        <CardContent className="py-2.5">
          <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
        </CardContent>
      )}
      <PostContent post={post} />
      <PostFooter post={post} />
    </Card>
  )
} 