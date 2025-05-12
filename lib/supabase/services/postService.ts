import { createClient } from '@supabase/supabase-js'
import type { Post, NewPost, UpdatePost } from '@/lib/types/database.types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function validatePostData(post: NewPost) {
  // 檢查用戶是否存在
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', post.user_id)
    .single()

  if (userError || !user) {
    throw new Error('Invalid user_id')
  }

  // 如果有關聯事件，檢查事件是否存在
  if (post.event_id) {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', post.event_id)
      .single()

    if (eventError || !event) {
      throw new Error('Invalid event_id')
    }
  }

  return true
}

export async function createPost(post: NewPost) {
  await validatePostData(post)

  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePost(id: string, post: UpdatePost) {
  const { data, error } = await supabase
    .from('posts')
    .update(post)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePost(id: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getPostById(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url
      ),
      post_media (
        id,
        media_url,
        media_type,
        aspect_ratio
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getPostsByEventId(eventId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url
      ),
      post_media (
        id,
        media_url,
        media_type,
        aspect_ratio
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
} 