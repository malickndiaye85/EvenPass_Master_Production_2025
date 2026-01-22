import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  BusRoute,
  BusBooking,
  CarpoolRide,
  CarpoolBooking,
  UserWallet,
  PricingConfig
} from '../types/transport';

export async function initializeTransportDatabase() {
  const line1: BusRoute = {
    id: 'line-1',
    name: 'Line 1: Dakar → Mbour',
    routeNumber: 1,
    origin: 'Dakar',
    destination: 'Mbour',
    distance: 80,
    duration: 90,
    stops: [
      { name: 'Dakar Centre', coordinates: [14.693425, -17.447938], order: 1 },
      { name: 'Rufisque', coordinates: [14.7167, -17.2667], order: 2 },
      { name: 'Bargny', coordinates: [14.6972, -17.2333], order: 3 },
      { name: 'Mbour', coordinates: [14.4166, -16.9666], order: 4 },
    ],
    pricing: {
      eco: 10000,
      comfort: 15000,
    },
    schedule: {
      eco: {
        firstDeparture: '05:00',
        lastDeparture: '22:00',
        frequency: 30,
      },
      comfort: {
        firstDeparture: '05:00',
        lastDeparture: '10:00',
        pauseStart: '10:00',
        pauseEnd: '16:00',
        resumeDeparture: '16:00',
        frequency: 45,
      },
    },
    isActive: true,
    createdAt: Timestamp.now(),
  };

  const line2: BusRoute = {
    id: 'line-2',
    name: 'Line 2: Dakar → Thiès',
    routeNumber: 2,
    origin: 'Dakar',
    destination: 'Thiès',
    distance: 70,
    duration: 75,
    stops: [
      { name: 'Dakar Centre', coordinates: [14.693425, -17.447938], order: 1 },
      { name: 'Pikine', coordinates: [14.7500, -17.4000], order: 2 },
      { name: 'Keur Massar', coordinates: [14.7833, -17.3167], order: 3 },
      { name: 'Thiès', coordinates: [14.7889, -16.9322], order: 4 },
    ],
    pricing: {
      eco: 15000,
      comfort: 30000,
    },
    schedule: {
      eco: {
        firstDeparture: '05:00',
        lastDeparture: '22:00',
        frequency: 30,
      },
      comfort: {
        firstDeparture: '05:00',
        lastDeparture: '10:00',
        pauseStart: '10:00',
        pauseEnd: '16:00',
        resumeDeparture: '16:00',
        frequency: 45,
      },
    },
    isActive: true,
    createdAt: Timestamp.now(),
  };

  const pricingConfig: PricingConfig = {
    id: 'transport-pricing',
    routes: {
      'line-1': {
        eco: 10000,
        comfort: 15000,
        lastUpdated: Timestamp.now(),
        updatedBy: 'system',
      },
      'line-2': {
        eco: 15000,
        comfort: 30000,
        lastUpdated: Timestamp.now(),
        updatedBy: 'system',
      },
    },
    subscriptions: {
      daily: {
        eco: 8000,
        comfort: 12000,
      },
      weekly: {
        eco: 50000,
        comfort: 75000,
      },
      monthly: {
        eco: 180000,
        comfort: 270000,
      },
    },
    adminEditable: true,
    lastModified: Timestamp.now(),
  };

  try {
    await setDoc(doc(db, 'transport-routes', 'line-1'), line1);
    await setDoc(doc(db, 'transport-routes', 'line-2'), line2);
    await setDoc(doc(db, 'pricing-config', 'transport-pricing'), pricingConfig);

    console.log('✅ Transport database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing transport database:', error);
    return { success: false, error };
  }
}

export async function getRoutes(): Promise<BusRoute[]> {
  try {
    const routesRef = collection(db, 'transport-routes');
    const routesQuery = query(routesRef, where('isActive', '==', true), orderBy('routeNumber'));
    const snapshot = await getDocs(routesQuery);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as BusRoute));
  } catch (error) {
    console.error('Error fetching routes:', error);
    return [];
  }
}

export async function getRoute(routeId: string): Promise<BusRoute | null> {
  try {
    const routeDoc = await getDoc(doc(db, 'transport-routes', routeId));

    if (routeDoc.exists()) {
      return { ...routeDoc.data(), id: routeDoc.id } as BusRoute;
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

export async function getPricing(): Promise<PricingConfig | null> {
  try {
    const pricingDoc = await getDoc(doc(db, 'pricing-config', 'transport-pricing'));

    if (pricingDoc.exists()) {
      return pricingDoc.data() as PricingConfig;
    }
    return null;
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return null;
  }
}

export async function updateRoutePricing(
  routeId: string,
  eco: number,
  comfort: number,
  adminId: string
): Promise<boolean> {
  try {
    const pricingRef = doc(db, 'pricing-config', 'transport-pricing');

    await updateDoc(pricingRef, {
      [`routes.${routeId}.eco`]: eco,
      [`routes.${routeId}.comfort`]: comfort,
      [`routes.${routeId}.lastUpdated`]: Timestamp.now(),
      [`routes.${routeId}.updatedBy`]: adminId,
      lastModified: Timestamp.now(),
    });

    const routeRef = doc(db, 'transport-routes', routeId);
    await updateDoc(routeRef, {
      'pricing.eco': eco,
      'pricing.comfort': comfort,
    });

    return true;
  } catch (error) {
    console.error('Error updating pricing:', error);
    return false;
  }
}

export async function createBusBooking(booking: Omit<BusBooking, 'id' | 'createdAt'>): Promise<string | null> {
  try {
    const bookingData = {
      ...booking,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'transport-bookings'), bookingData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
}

export async function getUserBookings(userId: string): Promise<BusBooking[]> {
  try {
    const bookingsRef = collection(db, 'transport-bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(bookingsQuery);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as BusBooking));
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
}

export async function getUserWallet(userId: string): Promise<UserWallet | null> {
  try {
    const walletDoc = await getDoc(doc(db, 'user-wallets', userId));

    if (walletDoc.exists()) {
      return walletDoc.data() as UserWallet;
    }

    const newWallet: UserWallet = {
      userId,
      balance: 0,
      currency: 'XOF',
      lastUpdated: Timestamp.now(),
      transactions: [],
    };

    await setDoc(doc(db, 'user-wallets', userId), newWallet);
    return newWallet;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
}

export async function updateWalletBalance(
  userId: string,
  amount: number,
  type: 'credit' | 'debit' | 'refund',
  description: string
): Promise<boolean> {
  try {
    const walletRef = doc(db, 'user-wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      await getUserWallet(userId);
    }

    const currentWallet = walletDoc.data() as UserWallet;
    const newBalance = type === 'debit'
      ? currentWallet.balance - amount
      : currentWallet.balance + amount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    const transaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      description,
      timestamp: Timestamp.now(),
    };

    await updateDoc(walletRef, {
      balance: newBalance,
      lastUpdated: Timestamp.now(),
      transactions: [...currentWallet.transactions, transaction],
    });

    return true;
  } catch (error) {
    console.error('Error updating wallet:', error);
    return false;
  }
}

export async function getCarpoolRides(): Promise<CarpoolRide[]> {
  try {
    const ridesRef = collection(db, 'carpool-rides');
    const ridesQuery = query(
      ridesRef,
      where('status', 'in', ['pending', 'confirmed']),
      orderBy('departureTime', 'asc')
    );
    const snapshot = await getDocs(ridesQuery);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as CarpoolRide));
  } catch (error) {
    console.error('Error fetching carpool rides:', error);
    return [];
  }
}

export async function createCarpoolRide(ride: Omit<CarpoolRide, 'id' | 'createdAt'>): Promise<string | null> {
  try {
    const rideData = {
      ...ride,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'carpool-rides'), rideData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating carpool ride:', error);
    return null;
  }
}

export async function bookCarpoolRide(booking: Omit<CarpoolBooking, 'id' | 'createdAt'>): Promise<string | null> {
  try {
    const bookingData = {
      ...booking,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'carpool-bookings'), bookingData);
    return docRef.id;
  } catch (error) {
    console.error('Error booking carpool ride:', error);
    return null;
  }
}
