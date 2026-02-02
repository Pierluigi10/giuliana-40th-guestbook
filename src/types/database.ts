export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'vip' | 'guest'
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'vip' | 'guest'
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'vip' | 'guest'
          is_approved?: boolean
          created_at?: string
        }
      }
      content: {
        Row: {
          id: string
          user_id: string
          type: 'text' | 'image' | 'video'
          text_content: string | null
          media_url: string | null
          thumbnail_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'text' | 'image' | 'video'
          text_content?: string | null
          media_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'text' | 'image' | 'video'
          text_content?: string | null
          media_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          approved_at?: string | null
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          content_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
    }
  }
}
