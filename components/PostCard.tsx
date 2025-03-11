"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReportButton } from "@/components/ReportButton"
import { MessageSquare, Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    created_at: string
    user: {
      id: string
      username: string
      avatar_url?: string
    }
    likes_count?: number
    comments_count?: number
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
          <AvatarFallback>{post.user.username?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-semibold">{post.user.username || '匿名用戶'}</p>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">{post.title}</h3>
        <p className="text-gray-600">{post.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4 mr-2" />
            {post.likes_count || 0}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            {post.comments_count || 0}
          </Button>
        </div>
        {!isOwnPost && currentUserId && (
          <ReportButton
            contentId={post.id}
            userId={post.user.id}
          />
        )}
      </CardFooter>
    </Card>
  )
} 