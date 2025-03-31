import type { Database } from './database.types'
import type { ProfileRole } from './supabase'

// 定義用戶角色類型
export type UserRole = ProfileRole

// 从数据库类型中提取Profile类型
export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  location: string | null
  bio: string | null
  role: ProfileRole
  created_at: string
  updated_at: string
  posts?: { count: number }
  reports?: { count: number }
  email?: string
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: Profile
  likes_count?: number
  comments_count?: number
}

export type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles?: Profile
  posts?: Post
}

export type Report = {
  id: string
  reporter_id: string
  reported_content_id: string
  reported_user_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  posts: {
    id: string
    caption: string | null
    media_url: string | null
    user_id: string
    profiles: {
      username: string
      avatar_url: string | null
    }
  } | null
  reporter: {
    username: string
    avatar_url: string | null
  } | null
} 