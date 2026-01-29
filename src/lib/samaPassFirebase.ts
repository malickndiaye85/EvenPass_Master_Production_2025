import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '../firebase';

const db = getFirestore(app);

export interface SamaPassSubscription {
  id: string;
  userId: string;
  type: 'weekly' | 'monthly';
  status: 'active' | 'expired' | 'cancelled';
  startDate: number;
  endDate: number;
  qrCode: string;
  createdAt: number;
  updatedAt: number;
  price: number;
}

export const samaPassService = {
  async getActiveSubscription(userId: string): Promise<SamaPassSubscription | null> {
    try {
      const subsRef = collection(db, `users/${userId}/subscriptions`);
      const q = query(
        subsRef,
        where('status', '==', 'active'),
        where('endDate', '>', Date.now()),
        orderBy('endDate', 'desc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SamaPassSubscription;
    } catch (error) {
      console.error('Error fetching active subscription:', error);
      return null;
    }
  },

  async createSubscription(
    userId: string,
    type: 'weekly' | 'monthly'
  ): Promise<SamaPassSubscription | null> {
    try {
      const startDate = Date.now();
      const durationDays = type === 'weekly' ? 7 : 30;
      const endDate = startDate + (durationDays * 24 * 60 * 60 * 1000);
      const price = type === 'weekly' ? 5000 : 15000;

      const subscriptionId = `pass_${Date.now()}`;
      const qrCode = `SAMAPASS-${userId}-${subscriptionId}`;

      const subscription: SamaPassSubscription = {
        id: subscriptionId,
        userId,
        type,
        status: 'active',
        startDate,
        endDate,
        qrCode,
        createdAt: startDate,
        updatedAt: startDate,
        price
      };

      const subsRef = doc(db, `users/${userId}/subscriptions`, subscriptionId);
      await setDoc(subsRef, subscription);

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
  },

  async cancelSubscription(userId: string, subscriptionId: string): Promise<boolean> {
    try {
      const subsRef = doc(db, `users/${userId}/subscriptions`, subscriptionId);
      await setDoc(subsRef, {
        status: 'cancelled',
        updatedAt: Date.now()
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  },

  async getSubscriptionHistory(userId: string): Promise<SamaPassSubscription[]> {
    try {
      const subsRef = collection(db, `users/${userId}/subscriptions`);
      const q = query(subsRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SamaPassSubscription));
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }
  },

  saveToLocalStorage(userId: string, subscription: SamaPassSubscription): void {
    try {
      localStorage.setItem(`sama_pass_${userId}`, JSON.stringify(subscription));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  loadFromLocalStorage(userId: string): SamaPassSubscription | null {
    try {
      const stored = localStorage.getItem(`sama_pass_${userId}`);
      if (stored) {
        const data = JSON.parse(stored) as SamaPassSubscription;
        if (data.endDate > Date.now()) {
          return data;
        } else {
          localStorage.removeItem(`sama_pass_${userId}`);
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  },

  clearLocalStorage(userId: string): void {
    try {
      localStorage.removeItem(`sama_pass_${userId}`);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
