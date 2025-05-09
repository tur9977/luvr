"use client"

import { CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import type { PostMedia, PostWithProfile } from "@/lib/types/database.types"

interface PostContentProps {
  post: PostWithProfile
  priority?: boolean
}

export function PostContent({ post, priority = false }: PostContentProps) {
  // 確保 post 物件存在
  if (!post) {
    console.warn('PostContent: post object is undefined')
    return null
  }

  // 確保有媒體內容
  if (!post.post_media || post.post_media.length === 0) {
    console.warn('PostContent: no media content available')
    return null
  }

  const mediaItems = post.post_media

  return (
    <CardContent className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="h-full"
        >
          {mediaItems.map((media: PostMedia) => (
            <SwiperSlide key={media.id}>
              {media.media_type === "image" ? (
                <Image
                  src={media.media_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover", width: "100%", height: "100%", aspectRatio: media.aspect_ratio.toString() }}
                  priority={priority}
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
      {post.content && (
        <p className="text-gray-600">{post.content}</p>
      )}
    </CardContent>
  )
} 