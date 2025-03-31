"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDistanceToNow, parseISO } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import { useInView } from "react-intersection-observer"
import { PostActions } from "./PostActions"
import type { PostWithProfile } from "@/lib/types/database.types"

// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

interface PostCardProps {
  post: PostWithProfile
}

export function PostCard({ post }: PostCardProps) {
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

  return (
    <Card ref={ref} className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            username={post.profiles.username || ""}
            avatarUrl={post.profiles.avatar_url || ""}
            role={post.profiles.role || "user"}
          />
          <div>
            <p className="font-medium">{post.profiles.username || "未知用戶"}</p>
            <p className="text-sm text-muted-foreground">
              {formattedDate}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {post.post_media && post.post_media.length > 0 && (
          <div className="relative">
            {post.post_media.length > 1 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="aspect-square"
              >
                {post.post_media.map((media, index) => (
                  <SwiperSlide key={index}>
                    {media.media_type === "video" ? (
                      <div className="relative aspect-square">
                        {inView && (
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                            preload="metadata"
                            poster={`${media.media_url}?width=600&quality=75`}
                            onLoadedData={() => setIsVideoLoading(false)}
                          >
                            <source src={media.media_url} type="video/mp4" />
                          </video>
                        )}
                      </div>
                    ) : (
                      <div className="relative aspect-square">
                        <Image
                          src={media.media_url}
                          alt={`Post ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index === 0}
                          quality={75}
                          loading={index === 0 ? "eager" : "lazy"}
                        />
                      </div>
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="relative">
                {post.post_media[0].media_type === "video" ? (
                  <div className="relative aspect-square">
                    {inView && (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                        poster={`${post.post_media[0].media_url}?width=600&quality=75`}
                        onLoadedData={() => setIsVideoLoading(false)}
                      >
                        <source src={post.post_media[0].media_url} type="video/mp4" />
                      </video>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-square">
                    <Image
                      src={post.post_media[0].media_url}
                      alt="Post"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority
                      quality={75}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {post.content && (
          <div className="p-4">
            <p className="text-sm">{post.content}</p>
          </div>
        )}
        <div className="p-4">
          <PostActions
            postId={post.id}
            userId={post.user_id}
            initialLikesCount={post._count?.likes || 0}
            initialCommentsCount={post._count?.comments || 0}
            initialSharesCount={post._count?.shares || 0}
            isLiked={post.has_liked || false}
            initialComments={post.comments}
          />
        </div>
      </CardContent>
    </Card>
  )
} 