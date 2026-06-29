export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_name: string | null;
          created_at: string;
          details: Json | null;
          id: string;
          school_id: string | null;
          target_id: string | null;
          target_label: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_name?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          school_id?: string | null;
          target_id?: string | null;
          target_label?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          school_id?: string | null;
          target_id?: string | null;
          target_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_daily_usage: {
        Row: {
          cnt: number;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          cnt?: number;
          usage_date: string;
          user_id: string;
        };
        Update: {
          cnt?: number;
          usage_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          answer_value: Json;
          created_at: string;
          id: string;
          question_id: string;
          session_id: string;
        };
        Insert: {
          answer_value: Json;
          created_at?: string;
          id?: string;
          question_id: string;
          session_id: string;
        };
        Update: {
          answer_value?: Json;
          created_at?: string;
          id?: string;
          question_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "test_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      bilimnoma_categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string;
          id: string;
          is_published: boolean;
          section: string;
          sort_order: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          is_published?: boolean;
          section: string;
          sort_order?: number;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          is_published?: boolean;
          section?: string;
          sort_order?: number;
          title?: string;
        };
        Relationships: [];
      };
      bilimnoma_entries: {
        Row: {
          body: string | null;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          demand: string | null;
          details: Json;
          icon: string;
          id: string;
          image_url: string | null;
          is_published: boolean;
          section: string;
          sort_order: number;
          summary: string | null;
          title: string;
        };
        Insert: {
          body?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          demand?: string | null;
          details?: Json;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          section: string;
          sort_order?: number;
          summary?: string | null;
          title: string;
        };
        Update: {
          body?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          demand?: string | null;
          details?: Json;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          section?: string;
          sort_order?: number;
          summary?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bilimnoma_entries_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "bilimnoma_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      careers: {
        Row: {
          created_at: string;
          description: string | null;
          holland_codes: string[] | null;
          id: string;
          name_uz: string;
          required_skills: string[] | null;
          salary_range: string | null;
          universities: Json | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          holland_codes?: string[] | null;
          id?: string;
          name_uz: string;
          required_skills?: string[] | null;
          salary_range?: string | null;
          universities?: Json | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          holland_codes?: string[] | null;
          id?: string;
          name_uz?: string;
          required_skills?: string[] | null;
          salary_range?: string | null;
          universities?: Json | null;
        };
        Relationships: [];
      };
      center_clubs: {
        Row: {
          age_range: string | null;
          created_at: string;
          description: string | null;
          icon: string;
          id: string;
          image_url: string | null;
          is_published: boolean;
          name: string;
          schedule: string | null;
          sort_order: number;
          teacher: string | null;
        };
        Insert: {
          age_range?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          name: string;
          schedule?: string | null;
          sort_order?: number;
          teacher?: string | null;
        };
        Update: {
          age_range?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          name?: string;
          schedule?: string | null;
          sort_order?: number;
          teacher?: string | null;
        };
        Relationships: [];
      };
      club_applications: {
        Row: {
          center_club_id: string | null;
          club_name: string | null;
          created_at: string;
          full_name: string;
          id: string;
          note: string | null;
          phone: string;
          status: string;
        };
        Insert: {
          center_club_id?: string | null;
          club_name?: string | null;
          created_at?: string;
          full_name: string;
          id?: string;
          note?: string | null;
          phone: string;
          status?: string;
        };
        Update: {
          center_club_id?: string | null;
          club_name?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          note?: string | null;
          phone?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_applications_center_club_id_fkey";
            columns: ["center_club_id"];
            isOneToOne: false;
            referencedRelation: "center_clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      club_members: {
        Row: {
          added_by: string | null;
          club_id: string;
          id: string;
          joined_at: string;
          notes: string | null;
          student_id: string;
        };
        Insert: {
          added_by?: string | null;
          club_id: string;
          id?: string;
          joined_at?: string;
          notes?: string | null;
          student_id: string;
        };
        Update: {
          added_by?: string | null;
          club_id?: string;
          id?: string;
          joined_at?: string;
          notes?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "archived_students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "counselor_directory";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "student_directory";
            referencedColumns: ["id"];
          },
        ];
      };
      clubs: {
        Row: {
          color: string;
          created_at: string;
          description: string;
          focus_area: string;
          icon: string;
          id: string;
          name: string;
          school_id: string | null;
        };
        Insert: {
          color?: string;
          created_at?: string;
          description?: string;
          focus_area?: string;
          icon?: string;
          id?: string;
          name: string;
          school_id?: string | null;
        };
        Update: {
          color?: string;
          created_at?: string;
          description?: string;
          focus_area?: string;
          icon?: string;
          id?: string;
          name?: string;
          school_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clubs_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clubs_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      council_activities: {
        Row: {
          activity_date: string | null;
          added_by: string | null;
          created_at: string;
          description: string | null;
          id: string;
          school_id: string | null;
          title: string;
        };
        Insert: {
          activity_date?: string | null;
          added_by?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          school_id?: string | null;
          title: string;
        };
        Update: {
          activity_date?: string | null;
          added_by?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          school_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "council_activities_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "council_activities_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      council_members: {
        Row: {
          added_by: string | null;
          created_at: string;
          elected_at: string | null;
          id: string;
          notes: string | null;
          position: string;
          school_id: string | null;
          sector: string;
          student_id: string;
          term: string;
        };
        Insert: {
          added_by?: string | null;
          created_at?: string;
          elected_at?: string | null;
          id?: string;
          notes?: string | null;
          position?: string;
          school_id?: string | null;
          sector?: string;
          student_id: string;
          term?: string;
        };
        Update: {
          added_by?: string | null;
          created_at?: string;
          elected_at?: string | null;
          id?: string;
          notes?: string | null;
          position?: string;
          school_id?: string | null;
          sector?: string;
          student_id?: string;
          term?: string;
        };
        Relationships: [
          {
            foreignKeyName: "council_members_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "council_members_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "council_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "archived_students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "council_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "counselor_directory";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "council_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "council_members_student_id_profiles_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "student_directory";
            referencedColumns: ["id"];
          },
        ];
      };
      extracurricular_enrollments: {
        Row: {
          added_by: string | null;
          created_at: string;
          direction: string;
          id: string;
          institution_name: string;
          schedule: string | null;
          start_date: string | null;
          status: string;
          student_id: string;
        };
        Insert: {
          added_by?: string | null;
          created_at?: string;
          direction?: string;
          id?: string;
          institution_name: string;
          schedule?: string | null;
          start_date?: string | null;
          status?: string;
          student_id: string;
        };
        Update: {
          added_by?: string | null;
          created_at?: string;
          direction?: string;
          id?: string;
          institution_name?: string;
          schedule?: string | null;
          start_date?: string | null;
          status?: string;
          student_id?: string;
        };
        Relationships: [];
      };
      message_reads: {
        Row: {
          message_id: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          message_id: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          message_id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          recipient_id: string | null;
          sender_id: string | null;
          sender_name: string | null;
          title: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          recipient_id?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          title?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          recipient_id?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
      news: {
        Row: {
          body: string;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          excerpt: string | null;
          id: string;
          published_at: string | null;
          status: string;
          title: string;
        };
        Insert: {
          body: string;
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          body?: string;
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          class_letter: string | null;
          class_number: number | null;
          created_at: string;
          full_name: string | null;
          gender: string | null;
          id: string;
          is_active: boolean;
          parent_id: string | null;
          passport_series: string | null;
          school_id: string | null;
          updated_at: string;
        };
        Insert: {
          birth_date?: string | null;
          class_letter?: string | null;
          class_number?: number | null;
          created_at?: string;
          full_name?: string | null;
          gender?: string | null;
          id: string;
          is_active?: boolean;
          parent_id?: string | null;
          passport_series?: string | null;
          school_id?: string | null;
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          class_letter?: string | null;
          class_number?: number | null;
          created_at?: string;
          full_name?: string | null;
          gender?: string | null;
          id?: string;
          is_active?: boolean;
          parent_id?: string | null;
          passport_series?: string | null;
          school_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      question_answer_keys: {
        Row: {
          correct_answer: Json;
          question_id: string;
        };
        Insert: {
          correct_answer: Json;
          question_id: string;
        };
        Update: {
          correct_answer?: Json;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_answer_keys_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: true;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          image_svg: string | null;
          options: Json;
          question_number: number;
          question_text_uz: string;
          question_type: string;
          subscale: string | null;
          test_id: string;
        };
        Insert: {
          id?: string;
          image_svg?: string | null;
          options?: Json;
          question_number: number;
          question_text_uz: string;
          question_type?: string;
          subscale?: string | null;
          test_id: string;
        };
        Update: {
          id?: string;
          image_svg?: string | null;
          options?: Json;
          question_number?: number;
          question_text_uz?: string;
          question_type?: string;
          subscale?: string | null;
          test_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: {
          created_at: string;
          district: string | null;
          expected_students: number | null;
          id: string;
          name: string;
          region: string | null;
        };
        Insert: {
          created_at?: string;
          district?: string | null;
          expected_students?: number | null;
          id?: string;
          name: string;
          region?: string | null;
        };
        Update: {
          created_at?: string;
          district?: string | null;
          expected_students?: number | null;
          id?: string;
          name?: string;
          region?: string | null;
        };
        Relationships: [];
      };
      student_achievements: {
        Row: {
          achieved_at: string | null;
          added_by: string | null;
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          level: string;
          result: string;
          student_id: string;
          title: string;
        };
        Insert: {
          achieved_at?: string | null;
          added_by?: string | null;
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          level?: string;
          result?: string;
          student_id: string;
          title: string;
        };
        Update: {
          achieved_at?: string | null;
          added_by?: string | null;
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          level?: string;
          result?: string;
          student_id?: string;
          title?: string;
        };
        Relationships: [];
      };
      student_profiles: {
        Row: {
          ai_summary: string | null;
          id: string;
          iq_scores: Json | null;
          profile_completeness: number;
          radar_scores: Json | null;
          student_id: string;
          top_careers: Json | null;
          top_universities: Json | null;
          updated_at: string;
        };
        Insert: {
          ai_summary?: string | null;
          id?: string;
          iq_scores?: Json | null;
          profile_completeness?: number;
          radar_scores?: Json | null;
          student_id: string;
          top_careers?: Json | null;
          top_universities?: Json | null;
          updated_at?: string;
        };
        Update: {
          ai_summary?: string | null;
          id?: string;
          iq_scores?: Json | null;
          profile_completeness?: number;
          radar_scores?: Json | null;
          student_id?: string;
          top_careers?: Json | null;
          top_universities?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_assignments: {
        Row: {
          counselor_id: string;
          id: string;
          review_note: string | null;
          reviewed_at: string | null;
          status: string;
          submission_note: string | null;
          submitted_at: string | null;
          task_id: string;
        };
        Insert: {
          counselor_id: string;
          id?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          status?: string;
          submission_note?: string | null;
          submitted_at?: string | null;
          task_id: string;
        };
        Update: {
          counselor_id?: string;
          id?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          status?: string;
          submission_note?: string | null;
          submitted_at?: string | null;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          title?: string;
        };
        Relationships: [];
      };
      test_results: {
        Row: {
          created_at: string;
          holland_code: string | null;
          id: string;
          personality_type: string | null;
          raw_scores: Json | null;
          scaled_scores: Json | null;
          student_id: string;
          test_id: string;
        };
        Insert: {
          created_at?: string;
          holland_code?: string | null;
          id?: string;
          personality_type?: string | null;
          raw_scores?: Json | null;
          scaled_scores?: Json | null;
          student_id: string;
          test_id: string;
        };
        Update: {
          created_at?: string;
          holland_code?: string | null;
          id?: string;
          personality_type?: string | null;
          raw_scores?: Json | null;
          scaled_scores?: Json | null;
          student_id?: string;
          test_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "test_results_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
        ];
      };
      test_sessions: {
        Row: {
          completed_at: string | null;
          id: string;
          started_at: string;
          status: string;
          student_id: string;
          test_id: string;
        };
        Insert: {
          completed_at?: string | null;
          id?: string;
          started_at?: string;
          status?: string;
          student_id: string;
          test_id: string;
        };
        Update: {
          completed_at?: string | null;
          id?: string;
          started_at?: string;
          status?: string;
          student_id?: string;
          test_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "test_sessions_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
        ];
      };
      tests: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_active: boolean;
          name_uz: string;
          question_count: number;
          test_type: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean;
          name_uz: string;
          question_count?: number;
          test_type?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean;
          name_uz?: string;
          question_count?: number;
          test_type?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      archived_students: {
        Row: {
          birth_date: string | null;
          class_letter: string | null;
          class_number: number | null;
          created_at: string | null;
          full_name: string | null;
          gender: string | null;
          id: string | null;
          parent_id: string | null;
          passport_series: string | null;
          school_id: string | null;
          school_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      counselor_directory: {
        Row: {
          created_at: string | null;
          full_name: string | null;
          id: string | null;
          is_active: boolean | null;
          last_activity: string | null;
          school_id: string | null;
          school_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      school_stats: {
        Row: {
          counselor_id: string | null;
          counselor_name: string | null;
          district: string | null;
          expected_students: number | null;
          id: string | null;
          last_activity: string | null;
          name: string | null;
          region: string | null;
          results_30d: number | null;
          student_count: number | null;
          tested_students: number | null;
        };
        Insert: {
          counselor_id?: never;
          counselor_name?: never;
          district?: string | null;
          expected_students?: number | null;
          id?: string | null;
          last_activity?: never;
          name?: string | null;
          region?: string | null;
          results_30d?: never;
          student_count?: never;
          tested_students?: never;
        };
        Update: {
          counselor_id?: never;
          counselor_name?: never;
          district?: string | null;
          expected_students?: number | null;
          id?: string | null;
          last_activity?: never;
          name?: string | null;
          region?: string | null;
          results_30d?: never;
          student_count?: never;
          tested_students?: never;
        };
        Relationships: [];
      };
      student_directory: {
        Row: {
          birth_date: string | null;
          class_letter: string | null;
          class_number: number | null;
          created_at: string | null;
          full_name: string | null;
          gender: string | null;
          id: string | null;
          parent_id: string | null;
          passport_series: string | null;
          school_id: string | null;
          school_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      get_my_role: { Args: never; Returns: string };
      get_my_school_id: { Args: never; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      in_my_school: { Args: { _user_id: string }; Returns: boolean };
      landing_stats: { Args: never; Returns: Json };
      analytics_overview: { Args: never; Returns: Json };
      counselor_dashboard: { Args: never; Returns: Json };
    };
    Enums: {
      app_role: "student" | "counselor" | "parent" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["student", "counselor", "parent", "admin"],
    },
  },
} as const;
