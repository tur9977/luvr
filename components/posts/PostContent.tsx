"use client"

import { CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import type { PostWithProfile } from "./PostCard"

interface PostMedia {
  id: string
  media_url: string
  media_type: "image" | "video"
  aspect_ratio: number
  duration?: number | null
  order: number
}

interface PostContentProps {
  post: PostWithProfile
}

export function PostContent({ post }: PostContentProps) {
  // 確保 post 物件存在
  if (!post) {
    console.warn('PostContent: post object is undefined')
    return null
  }

  // 確保有媒體 URL
  if (!post.media_url && (!post.post_media || post.post_media.length === 0)) {
    console.warn('PostContent: no media content available')
    return null
  }

  const mediaItems = post.post_media && post.post_media.length > 0
    ? post.post_media.sort((a, b) => a.order - b.order)
    : [{
        id: post.id,
        media_url: post.media_url,
        media_type: post.media_type,
        aspect_ratio: post.aspect_ratio || 1,
        duration: post.duration,
        order: 0
      }]

  const firstItem = mediaItems[0]

  // 處理單個媒體的情況
  if (mediaItems.length === 1) {
    if (firstItem.media_type === "video") {
      return (
        <CardContent className="p-0">
          <div className="relative aspect-square overflow-hidden">
            <video
              src={firstItem.media_url}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              playsInline
              poster={post.thumbnail_url || undefined}
            />
          </div>
        </CardContent>
      )
    }

    return (
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={firstItem.media_url}
            alt={post.caption || "Post image"}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
          />
        </div>
      </CardContent>
    )
  }

  // 處理多個媒體的情況
  return (
    <CardContent className="p-0">
      <div 
        className="relative w-full" 
        style={{ 
          paddingBottom: `${(1 / (firstItem.aspect_ratio || 1)) * 100}%`,
          minHeight: '200px'
        }}
      >
        <div className="absolute inset-0">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            className="h-full"
            style={{
              '--swiper-navigation-color': '#fff',
              '--swiper-pagination-color': '#fff',
            } as React.CSSProperties}
          >
            {mediaItems.map((media: PostMedia) => (
              <SwiperSlide key={media.id}>
                {media.media_type === "video" ? (
                  <div className="relative w-full h-full">
                    <video
                      src={media.media_url}
                      className="absolute inset-0 w-full h-full object-cover"
                      controls
                      playsInline
                      poster={post.thumbnail_url || undefined}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={media.media_url}
                      alt={post.caption || "Post image"}
                      fill
                      className="object-cover"
                      priority={media.order === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={90}
                    />
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </CardContent>
  )
} 