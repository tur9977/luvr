"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import { useInView } from "react-intersection-observer"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ReportButton } from "@/app/components/ReportButton"

// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

export function PostCard({ post }: { post: any }) {
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })
  const videoRef = useRef<HTMLVideoElement>(null)

  // 當視頻進入視圖時才加載
  const handleVideoInView = () => {
    if (videoRef.current && inView) {
      videoRef.current.load()
    }
  }

  // 優化圖片尺寸
  const getImageSize = (aspectRatio: number) => {
    const baseWidth = 600
    const height = Math.round(baseWidth / aspectRatio)
    return { width: baseWidth, height }
  }

  return (
    <Card ref={ref} className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              username={post.profiles.username}
              avatarUrl={post.profiles.avatar_url}
              role={post.profiles.role}
            />
            <div>
              <p className="font-medium">{post.profiles.username}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: zhTW
                })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ReportButton
                contentId={post.id}
                userId={post.user_id}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {post.post_media?.length > 0 && (
          <div className="relative">
            {post.post_media.length > 1 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="aspect-square"
              >
                {post.post_media.map((media: any, index: number) => (
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
        {post.caption && (
          <div className="p-4">
            <p className="text-sm">{post.caption}</p>
          </div>
        )}
        <div className="p-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{post.likes?.[0]?.count || 0} 個讚</span>
          <span>{post.comments?.[0]?.count || 0} 則留言</span>
        </div>
      </CardContent>
    </Card>
  )
} 