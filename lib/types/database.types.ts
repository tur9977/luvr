export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  location: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  created_at: string
  caption: string | null
  location: string | null
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url: string | null
  user_id: string
}

export type User = {
  id: string
  email: string
  raw_user_meta_data: {
    username?: string
    avatar_url?: string
  } | null
  username: string | null
  avatar_url: string | null
}

export type Like = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export type Share = {
  id: string
  post_id: string
  user_id: string | null
  created_at: string
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface AdminRoleRecord {
  id: string
  user_id: string
  role: AdminRole
  created_at: string
  updated_at: string
}

export type ReportType = 'post' | 'comment'
export type ReportStatus = 'pending' | 'processing' | 'resolved' | 'rejected'
export type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'nudity' | 'copyright' | 'other'

export interface Report {
  id: string
  reporter_id: string | null
  target_type: ReportType
  target_id: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  handler_id: string | null
  handled_at: string | null
  created_at: string
  updated_at: string
}

export type ActionType = 'ignore' | 'delete_content' | 'warn_user' | 'temp_ban' | 'permanent_ban'

export interface ReportAction {
  id: string
  report_id: string
  admin_id: string | null
  action: ActionType
  note: string | null
  created_at: string
}

export interface UserBan {
  id: string
  user_id: string
  admin_id: string | null
  reason: string
  start_at: string
  end_at: string | null
  created_at: string
}

export type LogAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'ban' | 'unban'

export interface AdminLog {
  id: string
  admin_id: string | null
  action: LogAction
  target_type: string
  target_id: string | null
  details: Record<string, any> | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at'>
        Update: Partial<Omit<Post, 'id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id'>
        Update: Partial<Omit<User, 'id'>>
      }
      likes: {
        Row: Like
        Insert: Omit<Like, 'id' | 'created_at'>
        Update: Partial<Omit<Like, 'id' | 'created_at'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'>
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>
      }
      shares: {
        Row: Share
        Insert: Omit<Share, 'id' | 'created_at'>
        Update: Partial<Omit<Share, 'id' | 'created_at'>>
      }
    }
  }
} 