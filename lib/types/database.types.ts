export type Profile = {
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

export type Database = {
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
    }
  }
} 