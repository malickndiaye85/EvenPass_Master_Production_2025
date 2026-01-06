export interface Vessel {
  id: string;
  name: string;
  type: 'ferry' | 'chaloupe';
  capacity_passengers: number;
  capacity_vehicles: number;
  capacity_cargo_kg: number;
  route: string;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: any;
}

export interface PassTicket {
  id: string;
  ticket_number: string;
  vessel_id: string;
  vessel_name: string;
  route: string;
  departure_date: string;
  departure_time: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_cni?: string;
  passenger_passport?: string;
  category: 'Cabine' | 'Pullman' | 'Standard';
  price: number;
  status: 'confirmed' | 'boarded' | 'cancelled';
  has_cargo: boolean;
  payment_method: string;
  qr_code: string;
  created_at: any;
  boarded_at?: any;
  boarded_by?: string;
}

export interface Cargo {
  id: string;
  cargo_type: 'vehicle' | 'merchandise';
  vessel_id: string;
  ticket_id?: string;
  passenger_name?: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  merchandise_description?: string;
  weight_kg: number;
  dimensions?: string;
  declared_value?: number;
  status: 'registered' | 'loaded' | 'unloaded';
  created_at: any;
  loaded_at?: any;
}

export interface Manifest {
  id: string;
  vessel_id: string;
  vessel_name: string;
  route: string;
  departure_date: string;
  departure_time: string;
  total_passengers: number;
  total_cargo_weight: number;
  total_vehicles: number;
  passengers: PassTicket[];
  cargo: Cargo[];
  status: 'draft' | 'ready' | 'departed' | 'arrived';
  generated_by: string;
  generated_at: any;
  departed_at?: any;
}

export interface MaritimeUser {
  id: string;
  email: string;
  name: string;
  role: 'commandant' | 'accueil' | 'fret' | 'commercial' | 'ops_manager';
  vessel_id?: string;
  vessel_name?: string;
  photo_url?: string;
  status: 'active' | 'suspended';
  created_at: any;
}

export interface VoyageStats {
  vessel_id: string;
  date: string;
  total_capacity: number;
  passengers_boarded: number;
  fill_rate: number;
  revenue_passengers: number;
  revenue_cargo: number;
  total_revenue: number;
  cargo_weight: number;
  vehicles_count: number;
}
