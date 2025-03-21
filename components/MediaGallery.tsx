"use client"

import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"

// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

interface PostMedia {
  id: string
  media_url: string
  media_type: string
  aspect_ratio: number
  duration: number | null
  order: number
}

interface MediaGalleryProps {
  media: PostMedia[]
  caption?: string | null
  priority?: boolean
}

export default function MediaGallery({ media, caption, priority = false }: MediaGalleryProps) {
  return (
    <div className="relative aspect-square">
      {media[0].media_type === "video" ? (
        <video
          src={media[0].media_url}
          controls
          className="w-full h-full object-cover"
        />
      ) : media.length === 1 ? (
        <Image
          src={media[0].media_url}
          alt={caption || "Post image"}
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="h-full rounded-lg"
          spaceBetween={0}
        >
          {media.sort((a, b) => a.order - b.order).map((item) => (
            <SwiperSlide key={item.id} className="relative h-full">
              <Image
                src={item.media_url}
                alt={caption || "Post image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  )
} 