export interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  imageUrl: string;
  description: string;
  p1?: number;
  p2?: number;
  p3?: number;
  standard?: number;
  vip?: number;
  vvip?: number;

  // Financial Model VIP & Fast Track (H.3)
  totalCapacity?: number;
  vipThreshold?: number; // Seuil VIP (défaut: 2000)
  exclusivityAgreement?: boolean; // Accord Exclusivité
  exclusivityCGUAccepted?: boolean; // CGU Exclusivité validées
  fastTrackEnabled?: boolean; // Libération 70% activée

  // Financial stats
  totalTicketsSold?: number;
  totalRevenue?: number;
  releasedFunds?: number; // Fonds libérés (70% pour VIP)
  escrowFunds?: number; // Fonds en séquestre (25%)
  platformCommission?: number; // Commission platform (5%)
}

export interface TicketCategory {
  name: string;
  price: number;
  available: boolean;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  merchantPhone?: string;
  role: 'user' | 'organizer';
}
