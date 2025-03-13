"use client"

import { Card } from "@/components/ui/card"
import { PostHeader } from "./PostHeader"
import { PostContent } from "./PostContent"
import { PostFooter } from "./PostFooter"
import type { Database } from "@/lib/types/database.types"

type Post = Database['public']['Tables']['posts']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export interface PostWithProfile extends Post {
  profiles: Profile
  _count?: {
    likes: number
    comments: number
    shares: number
  }
  has_liked?: boolean
  comments?: Comment[]
}

interface PostCardProps {
  post: PostWithProfile
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card>
      <PostHeader post={post} />
      <PostContent post={post} />
      <PostFooter post={post} />
    </Card>
  )
} 