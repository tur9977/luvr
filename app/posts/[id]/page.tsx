"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReportButton } from "@/components/ReportButton"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PostActions } from "@/components/PostActions"

interface PostDetailProps {
  params: {
    id: string
  }
}

export default function PostDetailPage({ params }: PostDetailProps) {
  const [post, setPost] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // Get post details
        const { data: post, error } = await supabase
          .from('contents')
          .select(`
            *,
            user:user_id (
              id,
              username,
              avatar_url
            ),
            likes:likes (
              id,
              user_id
            ),
            comments:comments (
              id,
              content,
              created_at,
              user:user_id (
                id,
                username,
                avatar_url
              )
            ),
            shares:shares (
              id
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        if (!post) {
          router.push('/404')
          return
        }

        setPost(post)
      } catch (error) {
        console.error('Error fetching post:', error)
        toast.error('載入貼文失敗')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [params.id])

  if (isLoading) {
    return <div className="p-6 text-center">載入中...</div>
  }

  if (!post) {
    return null
  }

  const isOwnPost = currentUser?.id === post.user_id

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar>
            <AvatarImage src={post.user.avatar_url} />
            <AvatarFallback>{post.user.username[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="font-semibold">{post.user.username}</p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true,
                locale: zhTW 
              })}
            </p>
          </div>
          {!isOwnPost && currentUser && (
            <ReportButton
              contentId={post.id}
              userId={post.user.id}
              className="ml-auto"
            />
          )}
        </CardHeader>
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
        </CardContent>
        <CardFooter>
          <PostActions
            postId={post.id}
            userId={post.user_id}
            initialLikesCount={post.likes?.length || 0}
            initialCommentsCount={post.comments?.length || 0}
            initialSharesCount={post.shares?.length || 0}
            isLiked={post.likes?.some(like => like.user_id === currentUser?.id) || false}
            initialComments={post.comments}
          />
        </CardFooter>
      </Card>
    </div>
  )
} 