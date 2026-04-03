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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      client_feedback: {
        Row: {
          client_id: string
          comment: string | null
          id: string
          project_id: string
          rating: number
          submitted_at: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          id?: string
          project_id: string
          rating: number
          submitted_at?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          id?: string
          project_id?: string
          rating?: number
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          payment_date: string
          payment_type: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_type?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar_url: string | null
          business_name: string
          company_address: string | null
          company_vat: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          monthly_amount: number | null
          notes: string | null
          phone: string | null
          plan: string | null
          portal_enabled: boolean | null
          portal_invited_at: string | null
          portal_last_login: string | null
          portal_user_id: string | null
          preferred_language: string | null
          prospect_id: string | null
          started_at: string | null
          status: string | null
          total_paid: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name: string
          company_address?: string | null
          company_vat?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          phone?: string | null
          plan?: string | null
          portal_enabled?: boolean | null
          portal_invited_at?: string | null
          portal_last_login?: string | null
          portal_user_id?: string | null
          preferred_language?: string | null
          prospect_id?: string | null
          started_at?: string | null
          status?: string | null
          total_paid?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string
          company_address?: string | null
          company_vat?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          phone?: string | null
          plan?: string | null
          portal_enabled?: boolean | null
          portal_invited_at?: string | null
          portal_last_login?: string | null
          portal_user_id?: string | null
          preferred_language?: string | null
          prospect_id?: string | null
          started_at?: string | null
          status?: string | null
          total_paid?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_reviews: {
        Row: {
          client_comment: string | null
          created_at: string | null
          description: string | null
          file_urls: Json | null
          id: string
          milestone_id: string | null
          project_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          client_comment?: string | null
          created_at?: string | null
          description?: string | null
          file_urls?: Json | null
          id?: string
          milestone_id?: string | null
          project_id: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          client_comment?: string | null
          created_at?: string | null
          description?: string | null
          file_urls?: Json | null
          id?: string
          milestone_id?: string | null
          project_id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_reviews_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          language: string | null
          name: string
          sector: string | null
          steps: Json
          total_converted: number | null
          total_enrolled: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name: string
          sector?: string | null
          steps: Json
          total_converted?: number | null
          total_enrolled?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name?: string
          sector?: string | null
          steps?: Json
          total_converted?: number | null
          total_enrolled?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_tracking: {
        Row: {
          created_at: string | null
          email_id: string | null
          event_data: Json | null
          event_type: Database["public"]["Enums"]["tracking_event"]
          id: string
          prospect_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_id?: string | null
          event_data?: Json | null
          event_type: Database["public"]["Enums"]["tracking_event"]
          id?: string
          prospect_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_id?: string | null
          event_data?: Json | null
          event_type?: Database["public"]["Enums"]["tracking_event"]
          id?: string
          prospect_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "prospect_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          position: number
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          position?: number
          quantity?: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          created_at: string | null
          default_items: Json | null
          default_notes: string | null
          default_tax_rate: number | null
          id: string
          name: string
          payment_terms_days: number | null
        }
        Insert: {
          created_at?: string | null
          default_items?: Json | null
          default_notes?: string | null
          default_tax_rate?: number | null
          id?: string
          name: string
          payment_terms_days?: number | null
        }
        Update: {
          created_at?: string | null
          default_items?: Json | null
          default_notes?: string | null
          default_tax_rate?: number | null
          id?: string
          name?: string
          payment_terms_days?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number
          client_id: string
          created_at: string | null
          currency: string
          due_date: string
          id: string
          internal_notes: string | null
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          project_id: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_hosted_url: string | null
          stripe_invoice_id: string | null
          stripe_payment_url: string | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number
          client_id: string
          created_at?: string | null
          currency?: string
          due_date: string
          id?: string
          internal_notes?: string | null
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          project_id?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_hosted_url?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_url?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          client_id?: string
          created_at?: string | null
          currency?: string
          due_date?: string
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          project_id?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_hosted_url?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_url?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_emails: {
        Row: {
          body: string
          id: string
          lead_id: string
          sent_at: string
          subject: string
          user_id: string
        }
        Insert: {
          body: string
          id?: string
          lead_id: string
          sent_at?: string
          subject: string
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          lead_id?: string
          sent_at?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          project_type: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          project_type?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          project_type?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      operation_logs: {
        Row: {
          cost_eur: number
          created_at: string
          description: string
          details: Json | null
          id: string
          operation_type: string
          prospect_count: number | null
          user_id: string
        }
        Insert: {
          cost_eur?: number
          created_at?: string
          description: string
          details?: Json | null
          id?: string
          operation_type: string
          prospect_count?: number | null
          user_id: string
        }
        Update: {
          cost_eur?: number
          created_at?: string
          description?: string
          details?: Json | null
          id?: string
          operation_type?: string
          prospect_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          project_id: string
          read_at: string | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          project_id: string
          read_at?: string | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          project_id?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "portal_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_notifications: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "portal_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          badge: string
          category: string
          challenge_de: string
          challenge_en: string
          challenge_fr: string
          client_brief_de: string
          client_brief_en: string
          client_brief_fr: string
          color: string
          created_at: string | null
          description_de: string
          description_en: string
          description_fr: string
          featured: boolean
          gallery_urls: string[]
          id: string
          name: string
          position: number
          results_de: string
          results_en: string
          results_fr: string
          screenshot_url: string | null
          slug: string | null
          solution_de: string
          solution_en: string
          solution_fr: string
          tags: string[]
          tags_de: string[]
          tags_en: string[]
          tech_stack: string[]
          updated_at: string | null
          url: string
          url_display: string
          video_url: string | null
          visible: boolean
        }
        Insert: {
          badge?: string
          category?: string
          challenge_de?: string
          challenge_en?: string
          challenge_fr?: string
          client_brief_de?: string
          client_brief_en?: string
          client_brief_fr?: string
          color?: string
          created_at?: string | null
          description_de?: string
          description_en?: string
          description_fr?: string
          featured?: boolean
          gallery_urls?: string[]
          id?: string
          name: string
          position?: number
          results_de?: string
          results_en?: string
          results_fr?: string
          screenshot_url?: string | null
          slug?: string | null
          solution_de?: string
          solution_en?: string
          solution_fr?: string
          tags?: string[]
          tags_de?: string[]
          tags_en?: string[]
          tech_stack?: string[]
          updated_at?: string | null
          url?: string
          url_display?: string
          video_url?: string | null
          visible?: boolean
        }
        Update: {
          badge?: string
          category?: string
          challenge_de?: string
          challenge_en?: string
          challenge_fr?: string
          client_brief_de?: string
          client_brief_en?: string
          client_brief_fr?: string
          color?: string
          created_at?: string | null
          description_de?: string
          description_en?: string
          description_fr?: string
          featured?: boolean
          gallery_urls?: string[]
          id?: string
          name?: string
          position?: number
          results_de?: string
          results_en?: string
          results_fr?: string
          screenshot_url?: string | null
          slug?: string | null
          solution_de?: string
          solution_en?: string
          solution_fr?: string
          tags?: string[]
          tags_de?: string[]
          tags_en?: string[]
          tech_stack?: string[]
          updated_at?: string | null
          url?: string
          url_display?: string
          video_url?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          position: number
          project_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          position: number
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string | null
          default_milestones: Json | null
          default_tasks: Json | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          default_milestones?: Json | null
          default_tasks?: Json | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          default_milestones?: Json | null
          default_tasks?: Json | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          currency: string | null
          deadline: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["project_priority"]
          project_type: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          project_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          project_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_emails: {
        Row: {
          body: string
          id: string
          prospect_id: string | null
          sent_at: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          id?: string
          prospect_id?: string | null
          sent_at?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          id?: string
          prospect_id?: string | null
          sent_at?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_emails_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          city: string | null
          company_size: string | null
          competitor_audit: Json | null
          competitor_site_url: string | null
          contact_count: number | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          email_count: number | null
          google_place_id: string | null
          has_website: boolean | null
          id: string
          language: string | null
          last_contacted_at: string | null
          last_emailed_at: string | null
          notes: string | null
          phone: string | null
          score: number | null
          score_breakdown: Json | null
          score_updated_at: string | null
          sector: string | null
          sequence_id: string | null
          sequence_paused: boolean | null
          sequence_step: number | null
          source: string | null
          status: Database["public"]["Enums"]["prospect_status"] | null
          tags: string[] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          company_size?: string | null
          competitor_audit?: Json | null
          competitor_site_url?: string | null
          contact_count?: number | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          email_count?: number | null
          google_place_id?: string | null
          has_website?: boolean | null
          id?: string
          language?: string | null
          last_contacted_at?: string | null
          last_emailed_at?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          score_breakdown?: Json | null
          score_updated_at?: string | null
          sector?: string | null
          sequence_id?: string | null
          sequence_paused?: boolean | null
          sequence_step?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["prospect_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          company_size?: string | null
          competitor_audit?: Json | null
          competitor_site_url?: string | null
          contact_count?: number | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          email_count?: number | null
          google_place_id?: string | null
          has_website?: boolean | null
          id?: string
          language?: string | null
          last_contacted_at?: string | null
          last_emailed_at?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          score_breakdown?: Json | null
          score_updated_at?: string | null
          sector?: string | null
          sequence_id?: string | null
          sequence_paused?: boolean | null
          sequence_step?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["prospect_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id: string
          is_active: boolean | null
          last_invoiced_at: string | null
          next_invoice_date: string
          project_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tax_rate: number | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          is_active?: boolean | null
          last_invoiced_at?: string | null
          next_invoice_date: string
          project_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tax_rate?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          is_active?: boolean | null
          last_invoiced_at?: string | null
          next_invoice_date?: string
          project_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tax_rate?: number | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          last_run_at: string | null
          name: string
          result_count: number | null
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          last_run_at?: string | null
          name: string
          result_count?: number | null
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          last_run_at?: string | null
          name?: string
          result_count?: number | null
        }
        Relationships: []
      }
      search_chunks: {
        Row: {
          business_type: string
          city: string | null
          continent: string | null
          cost_eur: number
          country: string | null
          created_at: string
          id: string
          mode: string
          results_count: number
          user_id: string
        }
        Insert: {
          business_type: string
          city?: string | null
          continent?: string | null
          cost_eur?: number
          country?: string | null
          created_at?: string
          id?: string
          mode?: string
          results_count?: number
          user_id: string
        }
        Update: {
          business_type?: string
          city?: string | null
          continent?: string | null
          cost_eur?: number
          country?: string | null
          created_at?: string
          id?: string
          mode?: string
          results_count?: number
          user_id?: string
        }
        Relationships: []
      }
      sector_templates: {
        Row: {
          audit_criteria: Json | null
          avg_deal_value: number | null
          conversion_rate: number | null
          created_at: string | null
          email_templates: Json | null
          icon: string | null
          id: string
          pitch_points: Json | null
          sector: string
          sector_label: string
          updated_at: string | null
        }
        Insert: {
          audit_criteria?: Json | null
          avg_deal_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          email_templates?: Json | null
          icon?: string | null
          id?: string
          pitch_points?: Json | null
          sector: string
          sector_label: string
          updated_at?: string | null
        }
        Update: {
          audit_criteria?: Json | null
          avg_deal_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          email_templates?: Json | null
          icon?: string | null
          id?: string
          pitch_points?: Json | null
          sector?: string
          sector_label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          business: string | null
          created_at: string
          id: string
          is_visible: boolean
          logo_url: string | null
          name: string
          photo_url: string | null
          position: number
          quote_de: string
          quote_en: string
          quote_fr: string
          rating: number
          role: string | null
          updated_at: string
        }
        Insert: {
          business?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          name: string
          photo_url?: string | null
          position?: number
          quote_de?: string
          quote_en?: string
          quote_fr?: string
          rating?: number
          role?: string | null
          updated_at?: string
        }
        Update: {
          business?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          name?: string
          photo_url?: string | null
          position?: number
          quote_de?: string
          quote_en?: string
          quote_fr?: string
          rating?: number
          role?: string | null
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "client"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
        | "refunded"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      message_sender_type: "client" | "team"
      notification_type:
        | "project_update"
        | "message"
        | "invoice"
        | "deliverable_review"
        | "milestone_completed"
        | "general"
      project_priority: "low" | "medium" | "high" | "urgent"
      project_status:
        | "brief"
        | "maquette"
        | "development"
        | "review"
        | "delivered"
        | "maintenance"
      prospect_status: "new" | "emailed" | "replied" | "converted" | "rejected"
      recurring_frequency: "weekly" | "monthly" | "quarterly" | "yearly"
      review_status: "pending" | "approved" | "revision_requested"
      task_status: "todo" | "in_progress" | "done"
      tracking_event:
        | "sent"
        | "opened"
        | "clicked"
        | "replied"
        | "bounced"
        | "unsubscribed"
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
      app_role: ["admin", "user", "client"],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
        "refunded",
      ],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      message_sender_type: ["client", "team"],
      notification_type: [
        "project_update",
        "message",
        "invoice",
        "deliverable_review",
        "milestone_completed",
        "general",
      ],
      project_priority: ["low", "medium", "high", "urgent"],
      project_status: [
        "brief",
        "maquette",
        "development",
        "review",
        "delivered",
        "maintenance",
      ],
      prospect_status: ["new", "emailed", "replied", "converted", "rejected"],
      recurring_frequency: ["weekly", "monthly", "quarterly", "yearly"],
      review_status: ["pending", "approved", "revision_requested"],
      task_status: ["todo", "in_progress", "done"],
      tracking_event: [
        "sent",
        "opened",
        "clicked",
        "replied",
        "bounced",
        "unsubscribed",
      ],
    },
  },
} as const
