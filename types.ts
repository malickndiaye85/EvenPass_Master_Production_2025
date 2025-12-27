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
