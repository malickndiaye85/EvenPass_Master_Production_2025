# DemDem Transport Types & Database Reference

## Transport Module Overview

The DemDem Super-App includes THREE transport sub-services:

### 1. Allo Dakar (Carpooling) 🚗
**Business Model:** Wallet & Refund Logic
**Target:** Inter-city carpooling

**Key Features:**
- Driver-passenger matching
- Real-time GPS tracking
- Wallet balance for riders
- Automated refunds on cancellation
- Driver ratings

**Database Collections:**
```typescript
interface CarpoolRide {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  origin: {
    name: string;
    coordinates: [number, number]; // [lat, lng]
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

interface CarpoolBooking {
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

interface UserWallet {
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
```

---

### 2. DemDem Express (Bus Navettes) 🚌
**Business Model:** Subscription Card (No Wallet)
**Target:** Daily commuters

**Key Features:**
- Fixed routes (Line 1, Line 2, etc.)
- Two tiers: Eco and Comfort
- Subscription-based (weekly, monthly)
- Split-shift logic (Comfort paused 10AM-4PM)
- Admin-editable pricing

**Database Collections:**
```typescript
interface BusRoute {
  id: string;
  name: string; // "Line 1: Dakar → Mbour"
  routeNumber: number; // 1, 2, 3...
  origin: string;
  destination: string;
  distance: number; // in km
  duration: number; // in minutes
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
      firstDeparture: string; // "05:00"
      lastDeparture: string; // "22:00"
      frequency: number; // minutes between buses
    };
    comfort: {
      firstDeparture: string; // "05:00"
      lastDeparture: string; // "10:00"
      pauseStart: string; // "10:00"
      pauseEnd: string; // "16:00"
      resumeDeparture: string; // "16:00"
      lastDeparture: string; // "22:00"
      frequency: number;
    };
  };
  isActive: boolean;
  createdAt: Timestamp;
}

interface BusSubscription {
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
  ridesRemaining?: number; // for non-unlimited plans
  isActive: boolean;
  qrCode: string; // 6-digit code for scanning
  createdAt: Timestamp;
}

interface BusBooking {
  id: string;
  userId: string;
  subscriptionId?: string; // null if single-ride
  routeId: string;
  tier: 'eco' | 'comfort';
  departureTime: Timestamp;
  seats: number;
  price: number;
  paymentMethod: 'subscription' | 'wave' | 'orange_money';
  status: 'pending' | 'confirmed' | 'used' | 'expired';
  qrCode: string;
  scannedAt?: Timestamp;
  scannedBy?: string; // controller ID
  createdAt: Timestamp;
}

interface PricingConfig {
  id: 'transport-pricing';
  routes: {
    [routeId: string]: {
      eco: number;
      comfort: number;
      lastUpdated: Timestamp;
      updatedBy: string; // admin ID
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
```

---

### 3. Pass Maritime (Already Implemented) ⛴️
**Business Model:** Subscription-based
**Target:** Dakar-Gorée, LMDG, COSAMA routes

**Status:** ✅ Already functional
- LMDG booking
- COSAMA booking
- Interregional routes
- Subscription management
- Wallet integration

**Database:** Existing collections in Firebase already handle this.

---

## Split-Shift Logic (Critical Business Rule)

### The "Comfort Pause" Rule

**Requirement:** Comfort tier buses are PAUSED between 10:00 AM and 04:00 PM.

**Implementation:**
```typescript
function isComfortAvailable(routeId: string): boolean {
  const now = new Date();
  const hour = now.getHours();

  // Comfort is NOT available between 10:00 and 16:00
  if (hour >= 10 && hour < 16) {
    return false;
  }

  return true;
}

// In booking UI:
if (selectedTier === 'comfort' && !isComfortAvailable(routeId)) {
  showError("Service Comfort non disponible entre 10h et 16h. Choisissez Eco ou revenez plus tard.");
  disableComfortBooking();
}
```

**Why?** Fleet optimization. Comfort buses are used for other routes during midday.

---

## Dynamic Pricing Admin Interface

### Required Features

1. **Route Pricing Editor**
   ```typescript
   function AdminPricingPanel() {
     // List all routes
     // For each route:
     //   - Show current Eco price
     //   - Show current Comfort price
     //   - Allow inline editing
     //   - Show price history
     //   - Log who changed prices and when
   }
   ```

2. **Subscription Pricing Editor**
   - Edit daily/weekly/monthly rates
   - Separate controls for Eco and Comfort
   - Preview impact on existing subscriptions

3. **Price History Log**
   - Track all price changes
   - Show admin who made changes
   - Timestamp all edits

### Security Rules (Firebase)
```javascript
// Only admins can edit pricing
match /pricing-config/{docId} {
  allow read: if true;
  allow write: if request.auth.token.role == 'admin';
}
```

---

## Wallet vs Subscription Logic

### Allo Dakar (Carpooling) = Wallet
- Users load money into wallet
- Each booking deducts from wallet
- Refunds return to wallet
- No subscriptions

### DemDem Express (Bus) = Subscription
- Users buy subscription cards (daily/weekly/monthly)
- Each ride validates QR code
- No wallet needed for subscribers
- Single-ride option available (pays per ride)

### Pass Maritime = Hybrid
- Supports both wallet and subscriptions
- Users choose payment method at checkout

---

## The "100km Rule" (Payout Logic)

**Requirement:** Hold funds for trips longer than 100km until trip completion.

**Implementation:**
```typescript
interface PayoutRule {
  distance: number; // in km
  holdDays: number;
  autoRelease: boolean;
}

const PAYOUT_RULES: PayoutRule[] = [
  { distance: 0, holdDays: 0, autoRelease: true }, // < 100km: instant
  { distance: 100, holdDays: 2, autoRelease: true }, // 100-200km: 2 days hold
  { distance: 200, holdDays: 3, autoRelease: false }, // > 200km: manual approval
];

function calculatePayoutDate(tripDistance: number, tripDate: Date): Date {
  const rule = PAYOUT_RULES.find(r => tripDistance >= r.distance) || PAYOUT_RULES[0];
  const releaseDate = new Date(tripDate);
  releaseDate.setDate(releaseDate.getDate() + rule.holdDays);
  return releaseDate;
}
```

**Why?** Prevents fraud. Long-distance trips need verification before releasing funds to drivers.

---

## Maps Integration

### Required Dependencies
```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

### Custom Pelias Configuration

The Master Prompt mentions using a custom Pelias instance hosted on a VPS for Senegal-specific geocoding.

**Setup:**
```typescript
// src/lib/geocoding.ts
export const PELIAS_ENDPOINT = import.meta.env.VITE_PELIAS_URL || 'https://pelias.example.com';

export async function searchLocation(query: string) {
  const response = await fetch(
    `${PELIAS_ENDPOINT}/v1/search?text=${encodeURIComponent(query)}&boundary.country=SEN`
  );
  return response.json();
}

export async function reverseGeocode(lat: number, lon: number) {
  const response = await fetch(
    `${PELIAS_ENDPOINT}/v1/reverse?point.lat=${lat}&point.lon=${lon}`
  );
  return response.json();
}
```

---

## Offline Controller App (EPscan) - Transport Mode

### Dual-Mode Scanning

**Event Mode:** Online validation (real-time DB check)
**Transport Mode:** Offline validation (local cache + sync)

**Implementation:**
```typescript
interface ScanMode {
  type: 'event' | 'transport';
  requiresOnline: boolean;
}

async function validateTicket(qrCode: string, mode: ScanMode) {
  if (mode.type === 'event') {
    // MUST be online
    return await validateOnline(qrCode);
  }

  if (mode.type === 'transport') {
    // Try offline first, sync later
    const cached = await getCachedTicket(qrCode);
    if (cached) {
      await markScannedOffline(qrCode);
      queueForSync(qrCode);
      return cached;
    }

    // Fallback to online if not cached
    return await validateOnline(qrCode);
  }
}
```

### iOS Compatibility (NoSleep.js)

**Critical:** iPhones sleep aggressively. Use NoSleep.js to keep screen active.

```typescript
import NoSleep from 'nosleep.js';

const noSleep = new NoSleep();

function enableWakeLock() {
  noSleep.enable();
  console.log('Wake lock enabled for iOS');
}

// Call on scanner page load
useEffect(() => {
  enableWakeLock();
  return () => noSleep.disable();
}, []);
```

---

## Next Implementation Steps

1. **Create Type Definitions**
   - `/src/types/transport.ts` with all interfaces above

2. **Seed Database**
   - Add initial routes (Line 1, Line 2)
   - Set default pricing in `pricing-config` collection

3. **Build UI Pages**
   - `/src/pages/transport/AlloDakarPage.tsx`
   - `/src/pages/transport/DemDemExpressPage.tsx`
   - `/src/components/AdminTransportPricing.tsx`

4. **Integrate Maps**
   - Set up Leaflet
   - Configure Pelias
   - Add location search components

5. **Implement Fleet Logic**
   - Comfort tier pause (10AM-4PM)
   - Availability checker
   - Booking blocker

---

**Reference:** Master Prompt V.13.3 for complete specifications.
