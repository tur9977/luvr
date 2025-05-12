export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = 'normal_user' | 'banned_user' | 'verified_user' | 'brand_user' | 'admin';
export type EventStatus = 'active' | 'ended' | 'cancelled';
export type EventCategory = 'party' | 'meetup' | 'online' | 'other';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  event_id: string | null;
  caption: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: EventStatus;
  category: EventCategory;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_content_id: string;
  reported_user_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  admin_note: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Post, 'id'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Event, 'id'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at' | 'resolved_at'>;
        Update: Partial<Omit<Report, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      count_user_posts: {
        Args: Record<string, never>;
        Returns: Array<{
          user_id: string;
          count: number;
        }>;
      };
      count_user_reports: {
        Args: Record<string, never>;
        Returns: Array<{
          user_id: string;
          count: number;
        }>;
      };
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      get_user_role: {
        Args: { user_id: string };
        Returns: ProfileRole;
      };
    };
    Enums: {
      event_status: EventStatus;
      event_category: EventCategory;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']; 