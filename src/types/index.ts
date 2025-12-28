import type { Database } from './database';

export type Event = Database['public']['Tables']['events']['Row'] & {
  category?: EventCategory;
  organizer?: Organizer;
  ticket_types?: TicketType[];
};

export type EventCategory = Database['public']['Tables']['event_categories']['Row'];
export type TicketType = Database['public']['Tables']['ticket_types']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Organizer = Database['public']['Tables']['organizers']['Row'];
export type PayoutRequest = Database['public']['Tables']['payout_requests']['Row'];
export type OrganizerBalance = Database['public']['Tables']['organizer_balances']['Row'];
export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];
export type TicketScan = Database['public']['Tables']['ticket_scans']['Row'];
export type EventStaff = Database['public']['Tables']['event_staff']['Row'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];

export interface FinancialBreakdown {
  sale_amount: number;
  platform_commission: number;
  platform_percentage: number;
  organizer_gross: number;
  organizer_gross_percentage: number;
  technical_fees: number;
  technical_fees_percentage: number;
  organizer_net: number;
  organizer_net_percentage: number;
}

export interface CartItem {
  ticket_type: TicketType;
  quantity: number;
  subtotal: number;
}

export interface CheckoutForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: 'wave' | 'orange_money';
}

export type UserRole = 'customer' | 'organizer' | 'admin' | 'staff';

export interface AuthUser extends User {
  role: UserRole;
  organizer?: Organizer;
  admin?: AdminUser;
}
