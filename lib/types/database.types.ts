export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          event_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          event_id?: string | null
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
          image_url: string | null
          creator_id: string
          created_at: string
          cover_url: string | null
          updated_at: string
          event_type: 'social' | 'sports' | 'education' | 'entertainment' | 'business' | 'other'
          participants_count: number
          comments_count: number
          photos_count: number
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          max_participants: number | null
          registration_deadline: string | null
          price: number
          currency: string
          tags: string[]
          metadata: Json
          category: string | null
          participants: string[] | null
          cover_image: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          location?: string | null
          image_url?: string | null
          creator_id: string
          created_at?: string
          cover_url?: string | null
          updated_at?: string
          event_type?: 'social' | 'sports' | 'education' | 'entertainment' | 'business' | 'other'
          participants_count?: number
          comments_count?: number
          photos_count?: number
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          max_participants?: number | null
          registration_deadline?: string | null
          price?: number
          currency?: string
          tags?: string[]
          metadata?: Json
          category?: string | null
          participants?: string[] | null
          cover_image?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          location?: string | null
          image_url?: string | null
          creator_id?: string
          created_at?: string
          cover_url?: string | null
          updated_at?: string
          event_type?: 'social' | 'sports' | 'education' | 'entertainment' | 'business' | 'other'
          participants_count?: number
          comments_count?: number
          photos_count?: number
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          max_participants?: number | null
          registration_deadline?: string | null
          price?: number
          currency?: string
          tags?: string[]
          metadata?: Json
          category?: string | null
          participants?: string[] | null
          cover_image?: string | null
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'going' | 'interested' | 'not_going'
          payment_status: 'pending' | 'paid' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'going' | 'interested' | 'not_going'
          payment_status?: 'pending' | 'paid' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'going' | 'interested' | 'not_going'
          payment_status?: 'pending' | 'paid' | 'refunded'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Post = Database['public']['Tables']['posts']['Row']
export type NewPost = Database['public']['Tables']['posts']['Insert']
export type UpdatePost = Database['public']['Tables']['posts']['Update']

export type Event = Database['public']['Tables']['events']['Row']
export type NewEvent = Database['public']['Tables']['events']['Insert']
export type UpdateEvent = Database['public']['Tables']['events']['Update']

export type EventParticipant = Database['public']['Tables']['event_participants']['Row']
export type NewEventParticipant = Database['public']['Tables']['event_participants']['Insert']
export type UpdateEventParticipant = Database['public']['Tables']['event_participants']['Update']
