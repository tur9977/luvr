"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { PostWithProfile } from "./PostCard"

interface PostHeaderProps {
  post: PostWithProfile
}

export function PostHeader({ post }: PostHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-center gap-4 p-4">
      <Avatar>
        <AvatarImage src={post.profiles?.avatar_url || '/placeholder.svg'} />
        <AvatarFallback>
          {(post.profiles?.username || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <Link 
          href={`/profile/${post.user_id}`} 
          className="text-sm font-semibold hover:underline"
        >
          {post.profiles?.username || '未知用戶'}
        </Link>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), {
            addSuffix: true,
            locale: zhTW,
          })}
          {post.location && ` · ${post.location}`}
        </p>
      </div>
    </CardHeader>
  )
} 