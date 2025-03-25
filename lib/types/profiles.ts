import type { Database } from './database.types'

// 定義用戶角色類型
export type UserRole = 'normal_user' | 'banned_user' | 'verified_user' | 'brand_user' | 'admin'

// 从数据库类型中提取Profile类型
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  posts?: { count: number } | null
  reports?: { count: number } | null
  role?: UserRole
  full_name?: string | null
  location?: string | null
  bio?: string | null
  email?: string | null
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