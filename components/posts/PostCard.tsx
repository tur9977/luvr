"use client"

import { useState, useRef } from "react"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { formatDistanceToNow, parseISO } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { ReportButton } from "@/components/ReportButton"
import { MessageSquare, Heart } from "lucide-react"
import { PostContent } from "./PostContent"
import type { PostWithProfile } from "@/lib/types/database.types"

interface PostCardProps {
  post: PostWithProfile
  currentUserId?: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  console.log('PostCard', { post, currentUserId });
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })
  const videoRef = useRef<HTMLVideoElement>(null)

  const formattedDate = post.created_at ? formatDistanceToNow(parseISO(post.created_at), {
    addSuffix: true,
    locale: zhTW
  }) : ""

  const isOwnPost = currentUserId === post.user_id

  return (
    <Card ref={ref} className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar
          username={post.profiles.username || "未知用戶"}
          avatarUrl={post.profiles.avatar_url}
          role={post.profiles.role as any || "user"}
        />
        <div className="flex-1">
          <p className="font-semibold">{post.profiles.username || "未知用戶"}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {formattedDate}
        </p>
      </CardHeader>

      <PostContent post={post} priority={true} />

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
            userId={post.user_id}
          />
        )}
      </CardFooter>
    </Card>
  )
} 