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
      analysis_results: {
        Row: {
          control_charts: Json | null
          created_at: string | null
          data_identifiers: Json | null
          descriptive_stats: Json | null
          error_message: string | null
          estimated_completion_time: string | null
          file_size_bytes: number | null
          id: string
          project_id: string
          results: Json
          started_at: string | null
          status: Database["public"]["Enums"]["analysis_status"] | null
        }
        Insert: {
          control_charts?: Json | null
          created_at?: string | null
          data_identifiers?: Json | null
          descriptive_stats?: Json | null
          error_message?: string | null
          estimated_completion_time?: string | null
          file_size_bytes?: number | null
          id?: string
          project_id: string
          results: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"] | null
        }
        Update: {
          control_charts?: Json | null
          created_at?: string | null
          data_identifiers?: Json | null
          descriptive_stats?: Json | null
          error_message?: string | null
          estimated_completion_time?: string | null
          file_size_bytes?: number | null
          id?: string
          project_id?: string
          results?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          ai_generated_content: Json | null
          archived_at: string | null
          author_id: string
          content: string
          created_at: string
          display_order: number | null
          featured: boolean | null
          hero_image_url: string | null
          id: string
          slug: string | null
          status: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated_content?: Json | null
          archived_at?: string | null
          author_id: string
          content: string
          created_at?: string
          display_order?: number | null
          featured?: boolean | null
          hero_image_url?: string | null
          id?: string
          slug?: string | null
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated_content?: Json | null
          archived_at?: string | null
          author_id?: string
          content?: string
          created_at?: string
          display_order?: number | null
          featured?: boolean | null
          hero_image_url?: string | null
          id?: string
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          complaint_text: string
          created_at: string | null
          id: string
          project_id: string
          source_url: string
          theme: string
          trend: string
        }
        Insert: {
          complaint_text: string
          created_at?: string | null
          id?: string
          project_id: string
          source_url: string
          theme: string
          trend: string
        }
        Update: {
          complaint_text?: string
          created_at?: string | null
          id?: string
          project_id?: string
          source_url?: string
          theme?: string
          trend?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          project_id: string
          storage_path: string
          type: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          project_id: string
          storage_path: string
          type: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          project_id?: string
          storage_path?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          client_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          program_name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          program_name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          program_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string | null
          deadline: string | null
          deleted_at: string | null
          id: string
          program_id: string | null
          project_name: string
          status: Database["public"]["Enums"]["project_status"] | null
          topics: string | null
          updated_at: string | null
          visible_in_client_portal: boolean | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          deadline?: string | null
          deleted_at?: string | null
          id?: string
          program_id?: string | null
          project_name: string
          status?: Database["public"]["Enums"]["project_status"] | null
          topics?: string | null
          updated_at?: string | null
          visible_in_client_portal?: boolean | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          deadline?: string | null
          deleted_at?: string | null
          id?: string
          program_id?: string | null
          project_name?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          topics?: string | null
          updated_at?: string | null
          visible_in_client_portal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_urls: {
        Row: {
          bbb_url: string | null
          created_at: string | null
          google_reviews_id: string | null
          id: string
          pissed_customer_url: string | null
          project_id: string
          trustpilot_url: string | null
          updated_at: string | null
        }
        Insert: {
          bbb_url?: string | null
          created_at?: string | null
          google_reviews_id?: string | null
          id?: string
          pissed_customer_url?: string | null
          project_id: string
          trustpilot_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bbb_url?: string | null
          created_at?: string | null
          google_reviews_id?: string | null
          id?: string
          pissed_customer_url?: string | null
          project_id?: string
          trustpilot_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraping_urls_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_cache: {
        Row: {
          id: string | null
          is_admin: boolean | null
        }
        Relationships: []
      }
      complaint_summaries: {
        Row: {
          complaints: string[] | null
          project_id: string | null
          sources: string[] | null
          theme: string | null
          volume: number | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_slug: {
        Args: {
          title: string
        }
        Returns: string
      }
    }
    Enums: {
      analysis_status:
        | "pending"
        | "analyzing"
        | "generating_control_charts"
        | "completed"
        | "failed"
      project_status: "Not Started" | "In Progress" | "Completed" | "Suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
