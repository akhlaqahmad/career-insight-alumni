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
      alumni_profiles: {
        Row: {
          about: string | null
          ai_summary: string | null
          created_at: string | null
          current_company: string | null
          current_title: string | null
          education: Json | null
          experience: Json | null
          id: string
          industry: string | null
          last_updated: string | null
          linkedin_url: string
          location: string | null
          name: string
          profile_picture_url: string | null
          raw_data: Json | null
          scraped_at: string | null
          scraping_job_id: string | null
          skills: string[] | null
        }
        Insert: {
          about?: string | null
          ai_summary?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          education?: Json | null
          experience?: Json | null
          id?: string
          industry?: string | null
          last_updated?: string | null
          linkedin_url: string
          location?: string | null
          name: string
          profile_picture_url?: string | null
          raw_data?: Json | null
          scraped_at?: string | null
          scraping_job_id?: string | null
          skills?: string[] | null
        }
        Update: {
          about?: string | null
          ai_summary?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          education?: Json | null
          experience?: Json | null
          id?: string
          industry?: string | null
          last_updated?: string | null
          linkedin_url?: string
          location?: string | null
          name?: string
          profile_picture_url?: string | null
          raw_data?: Json | null
          scraped_at?: string | null
          scraping_job_id?: string | null
          skills?: string[] | null
        }
        Relationships: []
      }
      scraping_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_completion: string | null
          failed_profiles: number
          filename: string
          id: string
          processed_profiles: number
          started_at: string | null
          status: Database["public"]["Enums"]["scraping_status"]
          successful_profiles: number
          total_profiles: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          failed_profiles?: number
          filename: string
          id?: string
          processed_profiles?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["scraping_status"]
          successful_profiles?: number
          total_profiles?: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          failed_profiles?: number
          filename?: string
          id?: string
          processed_profiles?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["scraping_status"]
          successful_profiles?: number
          total_profiles?: number
          user_id?: string | null
        }
        Relationships: []
      }
      scraping_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          linkedin_url: string
          max_attempts: number | null
          name: string | null
          priority: number | null
          scheduled_at: string | null
          scraped_data: Json | null
          scraping_job_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["scraping_status"]
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          linkedin_url: string
          max_attempts?: number | null
          name?: string | null
          priority?: number | null
          scheduled_at?: string | null
          scraped_data?: Json | null
          scraping_job_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["scraping_status"]
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          linkedin_url?: string
          max_attempts?: number | null
          name?: string | null
          priority?: number | null
          scheduled_at?: string | null
          scraped_data?: Json | null
          scraping_job_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["scraping_status"]
        }
        Relationships: [
          {
            foreignKeyName: "scraping_queue_scraping_job_id_fkey"
            columns: ["scraping_job_id"]
            isOneToOne: false
            referencedRelation: "scraping_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      scraping_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      scraping_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
