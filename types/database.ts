export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  profile?: Profile
  likes_count?: number
  comments_count?: number
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  image_url: string | null
  created_by: string
  created_at: string
  creator?: Profile
  participants_count?: number
} 