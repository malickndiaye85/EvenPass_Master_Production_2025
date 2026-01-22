import { Timestamp } from 'firebase/firestore';

export interface BusRoute {
  id: string;
  name: string;
  routeNumber: number;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  stops: Array<{
    name: string;
    coordinates: [number, number];
    order: number;
  }>;
  pricing: {
    eco: number;
    comfort: number;
  };
  schedule: {
    eco: {
      firstDeparture: string;
      lastDeparture: string;
      frequency: number;
    };
    comfort: {
      firstDeparture: string;
      lastDeparture: string;
      pauseStart: string;
      pauseEnd: string;
      resumeDeparture: string;
      frequency: number;
    };
  };
  isActive: boolean;
  createdAt: Timestamp;
}

export interface BusSubscription {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  routeId: string;
  tier: 'eco' | 'comfort';
  type: 'daily' | 'weekly' | 'monthly';
  price: number;
  startDate: Timestamp;
  endDate: Timestamp;
  ridesRemaining?: number;
  isActive: boolean;
  qrCode: string;
  createdAt: Timestamp;
}

export interface BusBooking {
  id: string;
  userId: string;
  subscriptionId?: string;
  routeId: string;
  tier: 'eco' | 'comfort';
  departureTime: Timestamp;
  seats: number;
  price: number;
  paymentMethod: 'subscription' | 'wave' | 'orange_money';
  status: 'pending' | 'confirmed' | 'used' | 'expired';
  qrCode: string;
  scannedAt?: Timestamp;
  scannedBy?: string;
  createdAt: Timestamp;
}

export interface CarpoolRide {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  origin: {
    name: string;
    coordinates: [number, number];
  };
  destination: {
    name: string;
    coordinates: [number, number];
  };
  departureTime: Timestamp;
  availableSeats: number;
  pricePerSeat: number;
  vehicleInfo: {
    model: string;
    plate: string;
    color: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

export interface CarpoolBooking {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  seatsBooked: number;
  totalPrice: number;
  paymentMethod: 'wallet' | 'wave' | 'orange_money';
  walletBalanceBefore: number;
  walletBalanceAfter: number;
  status: 'pending' | 'confirmed' | 'refunded' | 'completed';
  refundAmount?: number;
  refundReason?: string;
  createdAt: Timestamp;
}

export interface UserWallet {
  userId: string;
  balance: number;
  currency: 'XOF';
  lastUpdated: Timestamp;
  transactions: Array<{
    id: string;
    type: 'credit' | 'debit' | 'refund';
    amount: number;
    description: string;
    timestamp: Timestamp;
  }>;
}

export interface PricingConfig {
  id: 'transport-pricing';
  routes: {
    [routeId: string]: {
      eco: number;
      comfort: number;
      lastUpdated: Timestamp;
      updatedBy: string;
    };
  };
  subscriptions: {
    daily: {
      eco: number;
      comfort: number;
    };
    weekly: {
      eco: number;
      comfort: number;
    };
    monthly: {
      eco: number;
      comfort: number;
    };
  };
  adminEditable: boolean;
  lastModified: Timestamp;
}

export interface PayoutRule {
  distance: number;
  holdDays: number;
  autoRelease: boolean;
}

export const PAYOUT_RULES: PayoutRule[] = [
  { distance: 0, holdDays: 0, autoRelease: true },
  { distance: 100, holdDays: 2, autoRelease: true },
  { distance: 200, holdDays: 3, autoRelease: false },
];

export function calculatePayoutDate(tripDistance: number, tripDate: Date): Date {
  const rule = PAYOUT_RULES.find(r => tripDistance >= r.distance) || PAYOUT_RULES[0];
  const releaseDate = new Date(tripDate);
  releaseDate.setDate(releaseDate.getDate() + rule.holdDays);
  return releaseDate;
}

export function isComfortAvailable(): boolean {
  const now = new Date();
  const hour = now.getHours();

  return !(hour >= 10 && hour < 16);
}
