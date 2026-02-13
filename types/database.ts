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
          name: string
          role: 'driver' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'driver' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'driver' | 'admin'
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          user_id: string
          unit_number: string
          report_date: string
          location: string | null
          inspector_name: string | null
          pdf_url: string | null
          form_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unit_number: string
          report_date: string
          location?: string | null
          inspector_name?: string | null
          pdf_url?: string | null
          form_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unit_number?: string
          report_date?: string
          location?: string | null
          inspector_name?: string | null
          pdf_url?: string | null
          form_data?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
