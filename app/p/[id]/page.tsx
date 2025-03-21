import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { PostContent } from "@/components/posts/PostContent"
import { Card } from "@/components/ui/card"
import type { PostWithProfile } from "@/components/posts/PostCard"

interface PostComment {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface ExtendedPost extends Omit<PostWithProfile, 'comments'> {
  likes: { count: number }
  comments: PostComment[]
  commentsCount: number
  shares: { count: number }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPost(postId: string): Promise<ExtendedPost | null> {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_media (
        id,
        media_url,
        media_type,
        aspect_ratio,
        duration,
        order
      ),
      profiles:profiles!inner(
        id,
        username,
        avatar_url
      )
    `)
    .eq('id', postId)
    .single()

  if (error || !post) {
    console.error('Error fetching post:', error)
    return null
  }

  // 獲取貼文的互動數據
  const [
    { count: likesCount },
    { count: commentsCount },
    { count: sharesCount },
    { data: comments }
  ] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    supabase.from('shares').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    supabase
      .from('comments')
      .select(`
        *,
        profiles:profiles!inner(
          username,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
  ])

  return {
    ...post,
    likes: { count: likesCount || 0 },
    comments: (comments || []) as PostComment[],
    commentsCount: commentsCount || 0,
    shares: { count: sharesCount || 0 }
  }
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <Card>
        {/* 作者資訊 */}
        <div className="p-4 flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.profiles.avatar_url || '/placeholder.svg'} />
            <AvatarFallback>
              {post.profiles.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{post.profiles.username}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: zhTW
              })}
            </div>
          </div>
        </div>

        {/* 貼文內容 */}
        <PostContent post={post} />

        {/* 互動數據 */}
        <div className="p-4 flex gap-4 text-sm text-muted-foreground">
          <div>{post.likes.count} 個讚</div>
          <div>{post.commentsCount} 則留言</div>
          <div>{post.shares.count} 次分享</div>
        </div>
      </Card>

      {/* 留言列表 */}
      <div className="space-y-4">
        <h3 className="font-medium">留言</h3>
        {post.comments.length > 0 ? (
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profiles.avatar_url || '/placeholder.svg'} />
                  <AvatarFallback>
                    {comment.profiles.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-medium">{comment.profiles.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: zhTW
                      })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            目前沒有任何留言
          </div>
        )}
      </div>
    </div>
  )
} 