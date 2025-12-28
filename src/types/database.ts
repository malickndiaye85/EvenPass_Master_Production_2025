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
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          preferred_language: 'fr' | 'wo'
          preferred_payment_method: 'wave' | 'orange_money' | 'card' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          preferred_language?: 'fr' | 'wo'
          preferred_payment_method?: 'wave' | 'orange_money' | 'card' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          preferred_language?: 'fr' | 'wo'
          preferred_payment_method?: 'wave' | 'orange_money' | 'card' | null
          created_at?: string
          updated_at?: string
        }
      }
      organizers: {
        Row: {
          id: string
          user_id: string
          organization_name: string
          organization_type: 'individual' | 'company' | 'association' | 'ngo'
          description: string | null
          logo_url: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          verification_documents: Json
          contact_email: string
          contact_phone: string
          website: string | null
          social_media: Json
          bank_account_info: Json
          commission_rate: number
          total_events_created: number
          total_tickets_sold: number
          rating: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name: string
          organization_type?: 'individual' | 'company' | 'association' | 'ngo'
          description?: string | null
          logo_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_documents?: Json
          contact_email: string
          contact_phone: string
          website?: string | null
          social_media?: Json
          bank_account_info?: Json
          commission_rate?: number
          total_events_created?: number
          total_tickets_sold?: number
          rating?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string
          organization_type?: 'individual' | 'company' | 'association' | 'ngo'
          description?: string | null
          logo_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_documents?: Json
          contact_email?: string
          contact_phone?: string
          website?: string | null
          social_media?: Json
          bank_account_info?: Json
          commission_rate?: number
          total_events_created?: number
          total_tickets_sold?: number
          rating?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_categories: {
        Row: {
          id: string
          name_fr: string
          name_wo: string | null
          slug: string
          description: string | null
          icon: string | null
          color: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name_fr: string
          name_wo?: string | null
          slug: string
          description?: string | null
          icon?: string | null
          color?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name_fr?: string
          name_wo?: string | null
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          category_id: string | null
          title: string
          slug: string
          description: string | null
          short_description: string | null
          cover_image_url: string | null
          gallery_images: Json
          venue_name: string
          venue_address: string
          venue_city: string
          venue_coordinates: Json | null
          start_date: string
          end_date: string
          doors_open_time: string | null
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured: boolean
          is_free: boolean
          capacity: number | null
          min_age: number
          tags: string[]
          terms_and_conditions: string | null
          refund_policy: string | null
          metadata: Json
          view_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          category_id?: string | null
          title: string
          slug: string
          description?: string | null
          short_description?: string | null
          cover_image_url?: string | null
          gallery_images?: Json
          venue_name: string
          venue_address: string
          venue_city: string
          venue_coordinates?: Json | null
          start_date: string
          end_date: string
          doors_open_time?: string | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured?: boolean
          is_free?: boolean
          capacity?: number | null
          min_age?: number
          tags?: string[]
          terms_and_conditions?: string | null
          refund_policy?: string | null
          metadata?: Json
          view_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          category_id?: string | null
          title?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          cover_image_url?: string | null
          gallery_images?: Json
          venue_name?: string
          venue_address?: string
          venue_city?: string
          venue_coordinates?: Json | null
          start_date?: string
          end_date?: string
          doors_open_time?: string | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured?: boolean
          is_free?: boolean
          capacity?: number | null
          min_age?: number
          tags?: string[]
          terms_and_conditions?: string | null
          refund_policy?: string | null
          metadata?: Json
          view_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_types: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string | null
          price: number
          quantity_total: number
          quantity_sold: number
          quantity_reserved: number
          max_per_booking: number
          sale_start_date: string
          sale_end_date: string | null
          is_active: boolean
          display_order: number
          benefits: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description?: string | null
          price?: number
          quantity_total: number
          quantity_sold?: number
          quantity_reserved?: number
          max_per_booking?: number
          sale_start_date?: string
          sale_end_date?: string | null
          is_active?: boolean
          display_order?: number
          benefits?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          description?: string | null
          price?: number
          quantity_total?: number
          quantity_sold?: number
          quantity_reserved?: number
          max_per_booking?: number
          sale_start_date?: string
          sale_end_date?: string | null
          is_active?: boolean
          display_order?: number
          benefits?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          booking_number: string
          user_id: string | null
          event_id: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
          total_amount: number
          currency: string
          payment_method: 'wave' | 'orange_money' | 'card' | 'cash' | null
          customer_name: string
          customer_email: string
          customer_phone: string
          special_requests: string | null
          booking_date: string
          expires_at: string | null
          confirmed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_number: string
          user_id?: string | null
          event_id: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
          total_amount: number
          currency?: string
          payment_method?: 'wave' | 'orange_money' | 'card' | 'cash' | null
          customer_name: string
          customer_email: string
          customer_phone: string
          special_requests?: string | null
          booking_date?: string
          expires_at?: string | null
          confirmed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_number?: string
          user_id?: string | null
          event_id?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
          total_amount?: number
          currency?: string
          payment_method?: 'wave' | 'orange_money' | 'card' | 'cash' | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          special_requests?: string | null
          booking_date?: string
          expires_at?: string | null
          confirmed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          qr_code: string
          booking_id: string
          event_id: string
          ticket_type_id: string
          holder_name: string
          holder_email: string | null
          status: 'valid' | 'used' | 'cancelled' | 'refunded'
          price_paid: number
          check_in_time: string | null
          checked_in_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number: string
          qr_code: string
          booking_id: string
          event_id: string
          ticket_type_id: string
          holder_name: string
          holder_email?: string | null
          status?: 'valid' | 'used' | 'cancelled' | 'refunded'
          price_paid: number
          check_in_time?: string | null
          checked_in_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          qr_code?: string
          booking_id?: string
          event_id?: string
          ticket_type_id?: string
          holder_name?: string
          holder_email?: string | null
          status?: 'valid' | 'used' | 'cancelled' | 'refunded'
          price_paid?: number
          check_in_time?: string | null
          checked_in_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          payment_reference: string
          payment_method: 'wave' | 'orange_money' | 'card' | 'cash'
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          provider_response: Json
          phone_number: string | null
          transaction_fee: number
          net_amount: number | null
          platform_commission: number
          organizer_amount: number
          paid_at: string | null
          refunded_at: string | null
          refund_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          payment_reference: string
          payment_method: 'wave' | 'orange_money' | 'card' | 'cash'
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          provider_response?: Json
          phone_number?: string | null
          transaction_fee?: number
          net_amount?: number | null
          platform_commission?: number
          organizer_amount?: number
          paid_at?: string | null
          refunded_at?: string | null
          refund_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          payment_reference?: string
          payment_method?: 'wave' | 'orange_money' | 'card' | 'cash'
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          provider_response?: Json
          phone_number?: string | null
          transaction_fee?: number
          net_amount?: number | null
          platform_commission?: number
          organizer_amount?: number
          paid_at?: string | null
          refunded_at?: string | null
          refund_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payout_requests: {
        Row: {
          id: string
          organizer_id: string
          request_number: string
          amount_requested: number
          technical_fees: number
          net_amount: number
          status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
          payment_method: 'wave' | 'orange_money'
          payment_details: Json
          requested_at: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          transaction_reference: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          request_number: string
          amount_requested: number
          technical_fees: number
          net_amount: number
          status?: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
          payment_method: 'wave' | 'orange_money'
          payment_details: Json
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          transaction_reference?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          request_number?: string
          amount_requested?: number
          technical_fees?: number
          net_amount?: number
          status?: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
          payment_method?: 'wave' | 'orange_money'
          payment_details?: Json
          requested_at?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          transaction_reference?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      organizer_balances: {
        Row: {
          organizer_id: string
          total_sales: number
          platform_commission: number
          available_balance: number
          pending_payouts: number
          total_paid_out: number
          last_updated: string
        }
        Insert: {
          organizer_id: string
          total_sales?: number
          platform_commission?: number
          available_balance?: number
          pending_payouts?: number
          total_paid_out?: number
          last_updated?: string
        }
        Update: {
          organizer_id?: string
          total_sales?: number
          platform_commission?: number
          available_balance?: number
          pending_payouts?: number
          total_paid_out?: number
          last_updated?: string
        }
      }
      financial_transactions: {
        Row: {
          id: string
          transaction_type: 'ticket_sale' | 'commission' | 'payout_fee' | 'organizer_payout' | 'refund'
          related_booking_id: string | null
          related_payout_id: string | null
          organizer_id: string | null
          amount: number
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          transaction_type: 'ticket_sale' | 'commission' | 'payout_fee' | 'organizer_payout' | 'refund'
          related_booking_id?: string | null
          related_payout_id?: string | null
          organizer_id?: string | null
          amount: number
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          transaction_type?: 'ticket_sale' | 'commission' | 'payout_fee' | 'organizer_payout' | 'refund'
          related_booking_id?: string | null
          related_payout_id?: string | null
          organizer_id?: string | null
          amount?: number
          description?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      ticket_scans: {
        Row: {
          id: string
          ticket_id: string
          event_id: string
          scanned_by: string
          scan_time: string
          scan_location: string | null
          device_info: Json
          is_valid: boolean
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          event_id: string
          scanned_by: string
          scan_time?: string
          scan_location?: string | null
          device_info?: Json
          is_valid?: boolean
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          event_id?: string
          scanned_by?: string
          scan_time?: string
          scan_location?: string | null
          device_info?: Json
          is_valid?: boolean
          rejection_reason?: string | null
          created_at?: string
        }
      }
      event_staff: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: 'controller' | 'manager' | 'security' | 'coordinator'
          permissions: string[]
          assigned_by: string
          assigned_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role: 'controller' | 'manager' | 'security' | 'coordinator'
          permissions?: string[]
          assigned_by: string
          assigned_at?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          role?: 'controller' | 'manager' | 'security' | 'coordinator'
          permissions?: string[]
          assigned_by?: string
          assigned_at?: string
          is_active?: boolean
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: 'super_admin' | 'finance' | 'ops_manager' | 'support'
          permissions: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'super_admin' | 'finance' | 'ops_manager' | 'support'
          permissions?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'super_admin' | 'finance' | 'ops_manager' | 'support'
          permissions?: Json
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_financial_breakdown: {
        Args: { sale_amount: number }
        Returns: Json
      }
      generate_booking_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_qr_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_payout_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
