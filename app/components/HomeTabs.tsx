"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import NextImage from "next/image"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { ReportButton } from "./ReportButton"
import { supabase } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PostActions } from "@/components/PostActions"

type ProfileRole = 'user' | 'admin' | 'banned'

type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  role: ProfileRole
  created_at: string
}

type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles: Profile
}

type Post = {
  id: string
  created_at: string
  caption: string | null
  location: string | null
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url: string | null
  user_id: string
}

interface HomeTabsProps {
  posts: (Post & {
    profiles: Profile
    likes: { id: string, user_id: string }[]
    comments: Comment[]
    shares: { id: string }[]
  })[]
  currentUser: Profile | null
}

export function HomeTabs({ posts: initialPosts, currentUser }: HomeTabsProps) {
  const [posts, setPosts] = useState(initialPosts)

  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="posts">動態</TabsTrigger>
        <TabsTrigger value="events">活動</TabsTrigger>
      </TabsList>
      <TabsContent value="posts">
        {posts?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">目前沒有動態</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts?.map((post) => (
              <Card key={post.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.profiles.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.profiles.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: zhTW,
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-700">{post.caption}</p>
                  {post.media_type === 'image' && (
                    <div className="mt-4 relative aspect-video">
                      <NextImage
                        src={post.media_url}
                        alt="Post image"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {post.media_type === 'video' && (
                    <div className="mt-4">
                      <video
                        src={post.media_url}
                        poster={post.thumbnail_url || undefined}
                        controls
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <PostActions
                    postId={post.id}
                    userId={post.user_id}
                    initialLikesCount={post.likes?.length || 0}
                    initialCommentsCount={post.comments?.length || 0}
                    initialSharesCount={post.shares?.length || 0}
                    isLiked={post.likes?.some(like => like.user_id === currentUser?.id) || false}
                    initialComments={post.comments}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="events">
        <div className="text-center py-8">
          <p className="text-gray-500">活動功能即將推出</p>
        </div>
      </TabsContent>
    </Tabs>
  )
} 