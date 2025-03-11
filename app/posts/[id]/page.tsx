"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ReportButton } from "@/components/ReportButton"
import { MessageSquare, Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PostDetailProps {
  params: {
    id: string
  }
}

export default function PostDetailPage({ params }: PostDetailProps) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()
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
              email,
              username,
              avatar_url
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        setPost(post)
      } catch (error) {
        console.error('Error fetching post:', error)
        toast.error('載入貼文失敗')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.id])

  if (loading) {
    return <div className="p-6 text-center">載入中...</div>
  }

  if (!post) {
    return <div className="p-6 text-center">找不到貼文</div>
  }

  const isOwnPost = currentUser?.id === post.user.id

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
        </CardFooter>
      </Card>

      {/* Comments section will be added here */}
    </div>
  )
} 