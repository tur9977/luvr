"use client"

import { CardContent } from "@/components/ui/card"
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

interface PostContentProps {
  mediaItems: PostMedia[]
  thumbnail_url?: string | null
}

export function PostContent({
  mediaItems,
  thumbnail_url,
}: PostContentProps) {
  if (mediaItems.length === 0) return null

  const firstItem = mediaItems[0]

  if (mediaItems.length === 1 && firstItem.media_type === "video") {
    return (
      <CardContent className="p-0">
        <div className="relative w-full" style={{ paddingTop: `${(1 / firstItem.aspect_ratio) * 100}%` }}>
          <video
            src={firstItem.media_url}
            className="absolute inset-0 w-full h-full object-cover"
            controls
            playsInline
            poster={thumbnail_url || undefined}
          />
        </div>
      </CardContent>
    )
  }

  return (
    <CardContent className="p-0">
      <div 
        className="relative w-full" 
        style={{ 
          paddingBottom: `${(1 / firstItem.aspect_ratio) * 100}%`,
          minHeight: '200px'
        }}
      >
        {mediaItems.length > 1 ? (
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
              {mediaItems.map((media) => (
                <SwiperSlide key={media.id}>
                  {media.media_type === "video" ? (
                    <div className="relative w-full h-full">
                      <video
                        src={media.media_url}
                        className="absolute inset-0 w-full h-full object-cover"
                        controls
                        playsInline
                        poster={thumbnail_url || undefined}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={media.media_url}
                        alt=""
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
        ) : (
          <div className="absolute inset-0">
            <Image
              src={firstItem.media_url}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={90}
            />
          </div>
        )}
      </div>
    </CardContent>
  )
} 