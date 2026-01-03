export type PassengerCategory = 'non_resident' | 'resident_africa' | 'national' | 'goreen';
export type TripType = 'one_way' | 'round_trip';
export type PaymentMethod = 'wave' | 'orange_money';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PassStatus = 'active' | 'expired' | 'suspended';
export type SubscriptionDuration = 'monthly' | 'annual';
export type ServiceType = 'lmdg' | 'cosama' | 'interregional' | 'subscription';

export interface LMDGBooking {
  id: string;
  phone: string;
  route: 'dakar-goree' | 'goree-dakar';
  trip_type: TripType;
  passenger_category: PassengerCategory;
  adult_count: number;
  child_count: number;
  travel_date: Date;
  travel_time: string;
  total_price: number;
  booking_ref: string;
  status: BookingStatus;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'completed' | 'failed';
  qr_code: string;
  created_at: Date;
}

export interface LMDGPricing {
  category: PassengerCategory;
  adult_price: number;
  child_price: number;
}

export interface LMDGInventory {
  date: string;
  available_slots: number;
  departures: {
    time: string;
    available_seats: number;
  }[];
}

export interface COSAMABooking {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string;
  phone: string;
  route: 'dakar-ziguinchor' | 'ziguinchor-dakar';
  accommodation_type: 'pullman' | 'cabin_8' | 'cabin_4' | 'cabin_2';
  passenger_category: 'resident' | 'non_resident';
  adults: number;
  children_5_11: number;
  babies_0_4: number;
  vehicle_type?: 'car' | 'motorcycle' | null;
  base_price: number;
  supplements: number;
  vehicle_fee: number;
  total_price: number;
  travel_date: Date;
  booking_ref: string;
  status: BookingStatus;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'completed' | 'failed';
  qr_code: string;
  created_at: Date;
}

export interface COSAMAPricing {
  accommodation_type: 'pullman' | 'cabin_8' | 'cabin_4' | 'cabin_2';
  resident_price: number;
  non_resident_price: number;
  breakfast_included: boolean;
}

export interface COSAMAInventory {
  departure_id: string;
  date: Date;
  route: 'dakar-ziguinchor' | 'ziguinchor-dakar';
  pullman_available: number;
  cabin_8_available: number;
  cabin_4_available: number;
  cabin_2_available: number;
  vehicle_slots_available: number;
}

export interface COSAMAManifest {
  departure_id: string;
  date: Date;
  route: string;
  passengers: {
    adults_male: number;
    adults_female: number;
    children: number;
    babies: number;
    total: number;
  };
  vehicles: {
    cars: number;
    motorcycles: number;
  };
  generated_at: Date;
  generated_by: string;
}

export interface InterregionalBooking {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  departure_city: string;
  arrival_city: string;
  travel_date: Date;
  departure_time: string;
  seat_number: string;
  passenger_count: number;
  price_per_seat: number;
  total_price: number;
  operator: string;
  booking_ref: string;
  status: BookingStatus;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'completed' | 'failed';
  qr_code: string;
  created_at: Date;
}

export interface InterregionalRoute {
  id: string;
  departure_city: string;
  arrival_city: string;
  distance_km: number;
  base_price: number;
}

export interface InterregionalSchedule {
  id: string;
  route_id: string;
  operator_id: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  total_seats: number;
  date: Date;
}

export interface SubscriptionType {
  id: string;
  name: string;
  service: ServiceType;
  duration: SubscriptionDuration;
  price: number;
  validity_days: number;
  description: string;
  benefits: string[];
}

export interface PassSubscription {
  id: string;
  user_phone: string;
  full_name: string;
  photo_url: string;
  subscription_type_id: string;
  subscription_type?: SubscriptionType;
  qr_code: string;
  pass_number: string;
  issued_date: Date;
  expiry_date: Date;
  status: PassStatus;
  usage_count: number;
  last_scan_date?: Date;
  created_at: Date;
}

export interface PassTransaction {
  id: string;
  booking_ref: string;
  service: ServiceType;
  operator: string;
  gross_amount: number;
  commission: number;
  technical_fees: number;
  net_amount: number;
  payment_method: PaymentMethod;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export interface PassOperator {
  id: string;
  name: string;
  service_type: ServiceType;
  contact_email: string;
  contact_phone: string;
  balance: number;
  total_earnings: number;
  bank_details: {
    account_name: string;
    account_number: string;
    bank_name: string;
  };
  is_active: boolean;
}

export interface TicketScanPass {
  id: string;
  booking_ref: string;
  service: ServiceType;
  scanned_by: string;
  scanned_at: Date;
  location: string;
  passenger_photo_url?: string;
  id_verified: boolean;
}

export interface PassFinancialMetrics {
  total_revenue: number;
  lmdg_revenue: number;
  cosama_revenue: number;
  interregional_revenue: number;
  subscription_revenue: number;
  commission_evenpass: number;
  technical_fees: number;
  net_partner_revenue: number;
}

export const LMDG_PRICING: LMDGPricing[] = [
  { category: 'non_resident', adult_price: 5200, child_price: 2700 },
  { category: 'resident_africa', adult_price: 2700, child_price: 1700 },
  { category: 'national', adult_price: 1500, child_price: 500 },
  { category: 'goreen', adult_price: 100, child_price: 50 }
];

export const COSAMA_PRICING: COSAMAPricing[] = [
  { accommodation_type: 'pullman', resident_price: 5000, non_resident_price: 15500, breakfast_included: false },
  { accommodation_type: 'cabin_8', resident_price: 12500, non_resident_price: 18500, breakfast_included: false },
  { accommodation_type: 'cabin_4', resident_price: 24500, non_resident_price: 28500, breakfast_included: false },
  { accommodation_type: 'cabin_2', resident_price: 26500, non_resident_price: 30500, breakfast_included: true }
];

export const COSAMA_VEHICLE_FEES = {
  car: 63000,
  motorcycle: 30000
};

export const COMMISSION_RATE = 0.05;
export const TECHNICAL_FEES_RATE = 0.015;

export const calculateCommission = (grossAmount: number): number => {
  return Math.round(grossAmount * COMMISSION_RATE);
};

export const calculateTechnicalFees = (netAmount: number): number => {
  return Math.round(netAmount * TECHNICAL_FEES_RATE);
};

export const calculateFinalAmount = (grossAmount: number): number => {
  const commission = calculateCommission(grossAmount);
  const netAmount = grossAmount - commission;
  const technicalFees = calculateTechnicalFees(netAmount);
  return netAmount - technicalFees;
};
