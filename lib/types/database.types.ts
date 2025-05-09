export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          user_id: string
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

export type ProfileRole = 'user' | 'admin' | 'banned'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  role: ProfileRole
  created_at: string | null
}

export interface PostMedia {
  id: string
  media_url: string
  media_type: "image" | "video"
  aspect_ratio: number
  duration?: number | null
  order: number
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  created_at: string
  profiles?: Profile
  likes_count: number
  comments_count: number
  shares_count: number
  is_liked?: boolean
  location?: string | null
}

export interface PostWithProfile extends Post {
  profiles: Profile
  post_media?: PostMedia[]
  _count?: {
    likes: number
    comments: number
    shares: number
  }
  has_liked?: boolean
  comments?: PostComment[]
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Share {
  id: string
  post_id: string
  user_id: string
  created_at: string
}
