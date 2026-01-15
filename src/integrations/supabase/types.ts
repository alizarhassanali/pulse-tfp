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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      automation_logs: {
        Row: {
          automation_rule_id: string | null
          channel: string
          contact_id: string | null
          created_at: string | null
          id: string
          response_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          skip_reason: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          automation_rule_id?: string | null
          channel: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          response_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          automation_rule_id?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          response_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          brand_id: string | null
          channel: string
          created_at: string | null
          created_by: string | null
          delay_hours: number | null
          event_id: string | null
          feedback_condition: string
          id: string
          name: string
          status: string
          template_id: string | null
          throttle_days: number | null
          trigger_group: string
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          channel: string
          created_at?: string | null
          created_by?: string | null
          delay_hours?: number | null
          event_id?: string | null
          feedback_condition?: string
          id?: string
          name: string
          status?: string
          template_id?: string | null
          throttle_days?: number | null
          trigger_group: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          channel?: string
          created_at?: string | null
          created_by?: string | null
          delay_hours?: number | null
          event_id?: string | null
          feedback_condition?: string
          id?: string
          name?: string
          status?: string
          template_id?: string | null
          throttle_days?: number | null
          trigger_group?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          colors: Json | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          subdomain: string | null
          updated_at: string | null
        }
        Insert: {
          colors?: Json | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          subdomain?: string | null
          updated_at?: string | null
        }
        Update: {
          colors?: Json | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          subdomain?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_imports: {
        Row: {
          brand_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_count: number
          errors: Json | null
          file_name: string
          id: string
          status: string
          success_count: number
          total_rows: number
        }
        Insert: {
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          errors?: Json | null
          file_name: string
          id?: string
          status?: string
          success_count?: number
          total_rows?: number
        }
        Update: {
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number
          errors?: Json | null
          file_name?: string
          id?: string
          status?: string
          success_count?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_imports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tag_assignments: {
        Row: {
          contact_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tag_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          brand_id: string
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          location_id: string | null
          phone: string | null
          preferred_channel: string | null
          preferred_language: string | null
          status: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          location_id?: string | null
          phone?: string | null
          preferred_channel?: string | null
          preferred_language?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          location_id?: string | null
          phone?: string | null
          preferred_channel?: string | null
          preferred_language?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      event_feedback_tags: {
        Row: {
          archived: boolean | null
          created_at: string | null
          event_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_feedback_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_locations: {
        Row: {
          event_id: string
          location_id: string
        }
        Insert: {
          event_id: string
          location_id: string
        }
        Update: {
          event_id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_questions: {
        Row: {
          config: Json
          created_at: string | null
          event_id: string
          id: string
          order_num: number
          required: boolean | null
          show_for: string[] | null
          type: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          event_id: string
          id?: string
          order_num?: number
          required?: boolean | null
          show_for?: string[] | null
          type: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          event_id?: string
          id?: string
          order_num?: number
          required?: boolean | null
          show_for?: string[] | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          brand_id: string
          config: Json
          consent_config: Json | null
          created_at: string | null
          id: string
          intro_message: string | null
          languages: string[] | null
          metric_question: string | null
          name: string
          status: string
          thank_you_config: Json | null
          throttle_days: number | null
          translations: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          config?: Json
          consent_config?: Json | null
          created_at?: string | null
          id?: string
          intro_message?: string | null
          languages?: string[] | null
          metric_question?: string | null
          name: string
          status?: string
          thank_you_config?: Json | null
          throttle_days?: number | null
          translations?: Json | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          config?: Json
          consent_config?: Json | null
          created_at?: string | null
          id?: string
          intro_message?: string | null
          languages?: string[] | null
          metric_question?: string | null
          name?: string
          status?: string
          thank_you_config?: Json | null
          throttle_days?: number | null
          translations?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_categories: {
        Row: {
          archived: boolean | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          event_id: string
          id: string
          last_used_at: string | null
          sends_count: number | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          event_id: string
          id?: string
          last_used_at?: string | null
          sends_count?: number | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          event_id?: string
          id?: string
          last_used_at?: string | null
          sends_count?: number | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          brand_id: string
          city: string | null
          country: string | null
          created_at: string | null
          gmb_link: string | null
          google_place_id: string | null
          id: string
          name: string
          postal_code: string | null
          review_channels_config: Json | null
          state_province: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          brand_id: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          gmb_link?: string | null
          google_place_id?: string | null
          id?: string
          name: string
          postal_code?: string | null
          review_channels_config?: Json | null
          state_province?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          brand_id?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          gmb_link?: string | null
          google_place_id?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          review_channels_config?: Json | null
          state_province?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      response_category_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          category_id: string
          response_id: string
          source: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          category_id: string
          response_id: string
          source?: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          category_id?: string
          response_id?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "feedback_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_category_assignments_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      response_tag_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          response_id: string
          source: string
          tag_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          response_id: string
          source?: string
          tag_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          response_id?: string
          source?: string
          tag_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_tag_assignments_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "event_feedback_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          brand_id: string | null
          channel: string | null
          created_at: string | null
          external_id: string | null
          fetched_at: string | null
          id: string
          location_id: string | null
          rating: number | null
          responded_at: string | null
          response_text: string | null
          review_text: string | null
          reviewer_name: string | null
          source_url: string | null
        }
        Insert: {
          brand_id?: string | null
          channel?: string | null
          created_at?: string | null
          external_id?: string | null
          fetched_at?: string | null
          id?: string
          location_id?: string | null
          rating?: number | null
          responded_at?: string | null
          response_text?: string | null
          review_text?: string | null
          reviewer_name?: string | null
          source_url?: string | null
        }
        Update: {
          brand_id?: string | null
          channel?: string | null
          created_at?: string | null
          external_id?: string | null
          fetched_at?: string | null
          id?: string
          location_id?: string | null
          rating?: number | null
          responded_at?: string | null
          response_text?: string | null
          review_text?: string | null
          reviewer_name?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      sftp_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_count: number | null
          errors: Json | null
          file_name: string | null
          id: string
          integration_id: string | null
          skipped_count: number | null
          started_at: string
          status: string
          success_count: number | null
          total_rows: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          file_name?: string | null
          id?: string
          integration_id?: string | null
          skipped_count?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
          total_rows?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          file_name?: string | null
          id?: string
          integration_id?: string | null
          skipped_count?: number | null
          started_at?: string
          status?: string
          success_count?: number | null
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sftp_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_notes: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          note_text: string
          response_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          note_text: string
          response_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          note_text?: string
          response_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_notes_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_invitations: {
        Row: {
          channel: string
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          delivered_at: string | null
          event_id: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          event_id?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          event_id?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_invitations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answers: Json | null
          completed_at: string | null
          consent_given: boolean | null
          contact_id: string | null
          created_at: string | null
          device_info: Json | null
          event_id: string
          id: string
          invitation_id: string | null
          nps_score: number | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          consent_given?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          event_id: string
          id?: string
          invitation_id?: string | null
          nps_score?: number | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          consent_given?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          event_id?: string
          id?: string
          invitation_id?: string | null
          nps_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "survey_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          body: string | null
          brand_id: string | null
          created_at: string | null
          id: string
          name: string
          subject: string | null
          type: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          body?: string | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          subject?: string | null
          type: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          body?: string | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_brand_access: {
        Row: {
          brand_id: string
          user_id: string
        }
        Insert: {
          brand_id: string
          user_id: string
        }
        Update: {
          brand_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_brand_access_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_location_access: {
        Row: {
          location_id: string
          user_id: string
        }
        Insert: {
          location_id: string
          user_id: string
        }
        Update: {
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_location_access_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          custom_role_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_section_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_level"]
          section: Database["public"]["Enums"]["app_section"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          section: Database["public"]["Enums"]["app_section"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          section?: Database["public"]["Enums"]["app_section"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_section: {
        Args: {
          _section: Database["public"]["Enums"]["app_section"]
          _user_id: string
        }
        Returns: boolean
      }
      can_view_section: {
        Args: {
          _section: Database["public"]["Enums"]["app_section"]
          _user_id: string
        }
        Returns: boolean
      }
      get_user_section_permission: {
        Args: {
          _section: Database["public"]["Enums"]["app_section"]
          _user_id: string
        }
        Returns: Database["public"]["Enums"]["permission_level"]
      }
      has_brand_access: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "brand_admin"
        | "clinic_manager"
        | "staff"
        | "read_only"
      app_section:
        | "dashboard"
        | "questions"
        | "sent_logs"
        | "manage_events"
        | "integration"
        | "reviews"
        | "contacts"
        | "templates"
        | "brands"
        | "users"
      permission_level: "no_access" | "view" | "edit" | "respond"
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
      app_role: [
        "super_admin",
        "brand_admin",
        "clinic_manager",
        "staff",
        "read_only",
      ],
      app_section: [
        "dashboard",
        "questions",
        "sent_logs",
        "manage_events",
        "integration",
        "reviews",
        "contacts",
        "templates",
        "brands",
        "users",
      ],
      permission_level: ["no_access", "view", "edit", "respond"],
    },
  },
} as const
