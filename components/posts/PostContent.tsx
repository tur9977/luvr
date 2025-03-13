"use client"

import { CardContent } from "@/components/ui/card"
import NextImage from "next/image"
import type { PostWithProfile } from "./PostCard"

interface PostContentProps {
  post: PostWithProfile
}

export function PostContent({ post }: PostContentProps) {
  return (
    <CardContent className="p-0">
      {post.media_type === "video" ? (
        <div className="relative aspect-square">
          <video
            src={post.media_url}
            poster={post.thumbnail_url || undefined}
            controls
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="relative aspect-square">
          <NextImage
            src={post.media_url}
            alt={post.caption || "Post image"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      {post.caption && (
        <div className="p-4">
          <p className="text-sm">{post.caption}</p>
        </div>
      )}
    </CardContent>
  )
} 