"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReportButton } from "@/components/ReportButton"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import Link from "next/link"
import { PostActions } from "@/components/PostActions"

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    created_at: string
    likes_count?: number
    comments_count?: number
    shares_count?: number
    user: {
      id: string
      username: string
      avatar_url?: string
    }
    has_liked?: boolean
  }
  currentUserId?: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const isOwnPost = currentUserId === post.user.id

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={post.user.avatar_url} />
          <AvatarFallback>{post.user.username[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-semibold">{post.user.username}</p>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.created_at), { 
              addSuffix: true,
              locale: zhTW 
            })}
          </p>
        </div>
        {!isOwnPost && currentUserId && (
          <ReportButton
            contentId={post.id}
            userId={post.user.id}
            className="ml-auto"
          />
        )}
      </CardHeader>
      <CardContent>
        <Link href={`/posts/${post.id}`} className="block">
          <h2 className="text-xl font-bold mb-2 hover:text-blue-600">{post.title}</h2>
          <p className="text-gray-600 line-clamp-3">{post.content}</p>
        </Link>
      </CardContent>
      <CardFooter>
        <PostActions
          postId={post.id}
          userId={post.user.id}
          initialLikesCount={post.likes_count || 0}
          initialCommentsCount={post.comments_count || 0}
          initialSharesCount={post.shares_count || 0}
          isLiked={post.has_liked || false}
        />
      </CardFooter>
    </Card>
  )
} 