export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_value: Json
          created_at: string
          id: string
          question_id: string
          session_id: string
        }
        Insert: {
          answer_value: Json
          created_at?: string
          id?: string
          question_id: string
          session_id: string
        }
        Update: {
          answer_value?: Json
          created_at?: string
          id?: string
          question_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      careers: {
        Row: {
          created_at: string
          description: string | null
          holland_codes: string[] | null
          id: string
          name_uz: string
          required_skills: string[] | null
          salary_range: string | null
          universities: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          holland_codes?: string[] | null
          id?: string
          name_uz: string
          required_skills?: string[] | null
          salary_range?: string | null
          universities?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          holland_codes?: string[] | null
          id?: string
          name_uz?: string
          required_skills?: string[] | null
          salary_range?: string | null
          universities?: Json | null
        }
        Relationships: []
      }
      clubs: {
        Row: {
          color: string
          created_at: string
          description: string
          focus_area: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          focus_area?: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          focus_area?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      club_members: {
        Row: {
          added_by: string | null
          club_id: string
          id: string
          joined_at: string
          notes: string | null
          student_id: string
        }
        Insert: {
          added_by?: string | null
          club_id: string
          id?: string
          joined_at?: string
          notes?: string | null
          student_id: string
        }
        Update: {
          added_by?: string | null
          club_id?: string
          id?: string
          joined_at?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      council_members: {
        Row: {
          added_by: string | null
          created_at: string
          elected_at: string | null
          id: string
          notes: string | null
          position: string
          sector: string
          student_id: string
          term: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          elected_at?: string | null
          id?: string
          notes?: string | null
          position?: string
          sector?: string
          student_id: string
          term?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          elected_at?: string | null
          id?: string
          notes?: string | null
          position?: string
          sector?: string
          student_id?: string
          term?: string
        }
        Relationships: []
      }
      council_activities: {
        Row: {
          activity_date: string | null
          added_by: string | null
          created_at: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          activity_date?: string | null
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          activity_date?: string | null
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achieved_at: string | null
          added_by: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          level: string
          result: string
          student_id: string
          title: string
        }
        Insert: {
          achieved_at?: string | null
          added_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          result?: string
          student_id: string
          title: string
        }
        Update: {
          achieved_at?: string | null
          added_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          result?: string
          student_id?: string
          title?: string
        }
        Relationships: []
      }
      extracurricular_enrollments: {
        Row: {
          added_by: string | null
          created_at: string
          direction: string
          id: string
          institution_name: string
          schedule: string | null
          start_date: string | null
          status: string
          student_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          direction?: string
          id?: string
          institution_name: string
          schedule?: string | null
          start_date?: string | null
          status?: string
          student_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          direction?: string
          id?: string
          institution_name?: string
          schedule?: string | null
          start_date?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          class_letter: string | null
          class_number: number | null
          created_at: string
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          parent_id: string | null
          passport_series: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          class_letter?: string | null
          class_number?: number | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean
          parent_id?: string | null
          passport_series?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          class_letter?: string | null
          class_number?: number | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          parent_id?: string | null
          passport_series?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      question_answer_keys: {
        Row: {
          correct_answer: Json
          question_id: string
        }
        Insert: {
          correct_answer: Json
          question_id: string
        }
        Update: {
          correct_answer?: Json
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answer_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          id: string
          options: Json
          question_number: number
          question_text_uz: string
          question_type: string
          subscale: string | null
          test_id: string
        }
        Insert: {
          id?: string
          options?: Json
          question_number: number
          question_text_uz: string
          question_type?: string
          subscale?: string | null
          test_id: string
        }
        Update: {
          id?: string
          options?: Json
          question_number?: number
          question_text_uz?: string
          question_type?: string
          subscale?: string | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          district: string | null
          id: string
          name: string
          region: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          name: string
          region?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          ai_summary: string | null
          id: string
          iq_scores: Json | null
          profile_completeness: number
          radar_scores: Json | null
          student_id: string
          top_careers: Json | null
          top_universities: Json | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          id?: string
          iq_scores?: Json | null
          profile_completeness?: number
          radar_scores?: Json | null
          student_id: string
          top_careers?: Json | null
          top_universities?: Json | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          id?: string
          iq_scores?: Json | null
          profile_completeness?: number
          radar_scores?: Json | null
          student_id?: string
          top_careers?: Json | null
          top_universities?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          created_at: string
          holland_code: string | null
          id: string
          personality_type: string | null
          raw_scores: Json | null
          scaled_scores: Json | null
          student_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          holland_code?: string | null
          id?: string
          personality_type?: string | null
          raw_scores?: Json | null
          scaled_scores?: Json | null
          student_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          holland_code?: string | null
          id?: string
          personality_type?: string | null
          raw_scores?: Json | null
          scaled_scores?: Json | null
          student_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          completed_at: string | null
          id: string
          started_at: string
          status: string
          student_id: string
          test_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: string
          student_id: string
          test_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: string
          student_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          name_uz: string
          question_count: number
          test_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name_uz: string
          question_count?: number
          test_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name_uz?: string
          question_count?: number
          test_type?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_directory: {
        Row: {
          birth_date: string | null
          class_letter: string | null
          class_number: number | null
          created_at: string | null
          full_name: string | null
          gender: string | null
          // id — profiles.id (NOT NULL PK) dan keladi, hech qachon null bo'lmaydi
          id: string
          parent_id: string | null
          passport_series: string | null
          school_id: string | null
          school_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_students: {
        Row: {
          birth_date: string | null
          class_letter: string | null
          class_number: number | null
          created_at: string | null
          full_name: string | null
          gender: string | null
          id: string
          parent_id: string | null
          passport_series: string | null
          school_id: string | null
          school_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      app_role: "student" | "counselor" | "parent" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "counselor", "parent", "admin"],
    },
  },
} as const
