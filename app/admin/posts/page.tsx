import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { PostList } from "@/app/admin/components/PostList"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPosts() {
  const supabase = createServerComponentClient({ cookies })
  
  console.log('Fetching posts...')
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:profiles!inner(
        id,
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  // 獲取每個貼文的互動數據
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      const [{ count: likesCount }, { count: commentsCount }, { count: sharesCount }, { count: reportsCount }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('shares').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('post_id', post.id)
      ])

      return {
        ...post,
        likes: { count: likesCount || 0 },
        comments: { count: commentsCount || 0 },
        shares: { count: sharesCount || 0 },
        reports: { count: reportsCount || 0 }
      }
    })
  )

  console.log('Posts fetched:', postsWithCounts?.length || 0)
  return postsWithCounts || []
}

export default async function PostsPage() {
  console.log('Rendering PostsPage...')
  const posts = await getPosts()
  console.log('Posts loaded:', posts.length)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">貼文管理</h2>
      </div>
      <PostList posts={posts} />
    </div>
  )
} 