import type { Database as SupabaseDatabase } from './supabase'

export type Tables = SupabaseDatabase['public']['Tables']
export type Enums = SupabaseDatabase['public']['Enums']

export type Post = Tables['posts']['Row']
export type NewPost = Tables['posts']['Insert']
export type UpdatePost = Tables['posts']['Update']

export type Event = Tables['events']['Row']
export type NewEvent = Tables['events']['Insert']
export type UpdateEvent = Tables['events']['Update']

export type PostMedia = {
  id: string
  post_id: string
  media_url: string
  media_type: 'image' | 'video'
  aspect_ratio: number
  created_at: string
}

export type PostWithProfile = Post & {
  profiles: {
    id: string
    username: string | null
    avatar_url: string | null
  } | null
  post_media: PostMedia[]
  likes_count: number
  comments_count: number
  shares_count: number
}

export type EventWithProfile = Event & {
  profiles: {
    id: string
    username: string | null
    avatar_url: string | null
  } | null
  participants_count: number
}

export type ProfileRole = SupabaseDatabase['public']['Tables']['profiles']['Row']['role']
export type EventStatus = SupabaseDatabase['public']['Enums']['event_status']
export type EventCategory = SupabaseDatabase['public']['Enums']['event_category']

export type Profile = SupabaseDatabase['public']['Tables']['profiles']['Row']

export type PostLike = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export type PostComment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export type Like = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export type Share = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          user_id: string
          event_id: string | null
          media_urls: string[]
          media_url?: string
          media_type: "image" | "video"
          thumbnail_url: string | null
          aspect_ratio: number
          duration: number | null
          caption: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id?: string | null
          media_urls: string[]
          media_url?: string
          media_type: "image" | "video"
          thumbnail_url?: string | null
          aspect_ratio: number
          duration?: number | null
          caption?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string | null
          media_urls?: string[]
          media_url?: string
          media_type?: "image" | "video"
          thumbnail_url?: string | null
          aspect_ratio?: number
          duration?: number | null
          caption?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          location: string | null
          cover_url: string | null
          user_id: string
          event_type: string
          status: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled"
          max_participants: number | null
          registration_deadline: string | null
          price: number | null
          currency: string | null
          tags: string[] | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          location?: string | null
          cover_url?: string | null
          user_id: string
          event_type?: string
          status?: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled"
          max_participants?: number | null
          registration_deadline?: string | null
          price?: number | null
          currency?: string | null
          tags?: string[] | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          location?: string | null
          cover_url?: string | null
          user_id?: string
          event_type?: string
          status?: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled"
          max_participants?: number | null
          registration_deadline?: string | null
          price?: number | null
          currency?: string | null
          tags?: string[] | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      event_participants: {
        Row: {
          event_id: string
          user_id: string
          status: "going" | "interested" | "not_going"
          payment_status: "pending" | "paid" | "refunded" | "cancelled" | null
          payment_details: any | null
          check_in_time: string | null
          notes: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          status: "going" | "interested" | "not_going"
          payment_status?: "pending" | "paid" | "refunded" | "cancelled" | null
          payment_details?: any | null
          check_in_time?: string | null
          notes?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          status?: "going" | "interested" | "not_going"
          payment_status?: "pending" | "paid" | "refunded" | "cancelled" | null
          payment_details?: any | null
          check_in_time?: string | null
          notes?: string | null
          metadata?: any | null
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
