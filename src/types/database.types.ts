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
      topics: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          image_url: string | null
          created_at: string
          updated_at: string
          likes_count: number
          dislikes_count: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
        }
      }
      answers: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
          likes_count: number
          dislikes_count: number
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
        }
      }
      topic_reactions: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string
          reaction_type?: 'like' | 'dislike'
          created_at?: string
        }
      }
      answer_reactions: {
        Row: {
          id: string
          answer_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at: string
        }
        Insert: {
          id?: string
          answer_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at?: string
        }
        Update: {
          id?: string
          answer_id?: string
          user_id?: string
          reaction_type?: 'like' | 'dislike'
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
