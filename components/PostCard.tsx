"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReportButton } from "@/components/ReportButton"
import { MessageSquare, Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

interface PostMedia {
  id: string
  media_url: string
  media_type: "image" | "video"
  aspect_ratio: number
  duration?: number | null
  order: number
}

interface PostCardProps {
  post: {
    id: string
    caption: string
    location?: string
    created_at: string
    media_url: string
    media_type: "image" | "video"
    aspect_ratio: number
    duration?: number | null
    user: {
      id: string
      username: string
      avatar_url?: string
    }
    likes_count?: number
    comments_count?: number
    post_media?: PostMedia[]
  }
  currentUserId?: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const isOwnPost = currentUserId === post.user.id
  const hasMultipleMedia = post.post_media && post.post_media.length > 1
  const mediaItems = hasMultipleMedia && post.post_media 
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
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={post.user.avatar_url} />
          <AvatarFallback>{post.user.username?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-semibold">{post.user.username || '匿名用戶'}</p>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.created_at), { 
              addSuffix: true,
              locale: zhTW 
            })}
          </p>
          {post.location && (
            <p className="text-sm text-gray-500">{post.location}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            className="h-full"
          >
            {mediaItems.map((media) => (
              <SwiperSlide key={media.id}>
                {media.media_type === "image" ? (
                  <Image
                    src={media.media_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <video
                    src={media.media_url}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                  />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        {post.caption && (
          <p className="text-gray-600">{post.caption}</p>
        )}
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