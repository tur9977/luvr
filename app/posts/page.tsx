"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "@/components/PostCard"
import { toast } from "sonner"

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // Get posts
        const { data: posts, error } = await supabase
          .from('contents')
          .select(`
            *,
            user:user_id (
              id,
              username,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPosts(posts || [])
      } catch (error) {
        console.error('Error fetching posts:', error)
        toast.error('載入貼文失敗')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return <div className="p-6 text-center">載入中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500">還沒有任何貼文</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
            />
          ))
        )}
      </div>
    </div>
  )
} 