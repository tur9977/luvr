import { createClient } from '@supabase/supabase-js'
import { Post, NewPost, UpdatePost, PostWithProfile } from '../types/database.types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getPosts(page = 1, limit = 10): Promise<PostWithProfile[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url),
      post_media (*)
    `)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error
  return data || []
}

export async function getPostById(id: string): Promise<PostWithProfile | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url),
      post_media (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createPost(post: NewPost): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePost(id: string, post: UpdatePost): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update(post)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })

  if (error) throw error

  // 更新貼文讚數
  await supabase.rpc('increment_post_likes', { post_id: postId })
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) throw error

  // 更新貼文讚數
  await supabase.rpc('decrement_post_likes', { post_id: postId })
} 