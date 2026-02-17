import { firestore } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';

export interface PassSubscription {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  type: 'weekly' | 'monthly';
  status: 'active' | 'expired' | 'cancelled';
  startDate: number;
  endDate: number;
  qrCode: string;
  createdAt: number;
  price: number;
}

const CACHE_KEY_PREFIX = 'demdem_pass_';

export const passPhoneService = {
  async findSubscriptionByPhone(phoneNumber: string): Promise<PassSubscription | null> {
    try {
      const cleanPhone = phoneNumber.replace(/\s+/g, '');

      console.log('[PASS] 🔍 Recherche abonnement pour:', cleanPhone);

      const subsRef = collection(firestore, 'subscriptions');
      const q = query(
        subsRef,
        where('phoneNumber', '==', cleanPhone),
        where('status', '==', 'active'),
        where('endDate', '>', Date.now()),
        orderBy('endDate', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('[PASS] ❌ Aucun abonnement actif trouvé pour:', cleanPhone);
        return null;
      }

      const doc = snapshot.docs[0];
      const subscription = { id: doc.id, ...doc.data() } as PassSubscription;

      console.log('[PASS] ✅ Abonnement trouvé:', subscription);
      return subscription;
    } catch (error) {
      console.error('[PASS] ❌ Erreur lors de la recherche:', error);
      return null;
    }
  },

  saveToCache(phoneNumber: string, subscription: PassSubscription): void {
    try {
      const cleanPhone = phoneNumber.replace(/\s+/g, '');
      const cacheKey = `${CACHE_KEY_PREFIX}${cleanPhone}`;

      localStorage.setItem(cacheKey, JSON.stringify(subscription));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

      console.log('[PASS] 💾 Abonnement sauvegardé en cache pour:', cleanPhone);
    } catch (error) {
      console.error('[PASS] ❌ Erreur sauvegarde cache:', error);
    }
  },

  loadFromCache(phoneNumber: string): PassSubscription | null {
    try {
      const cleanPhone = phoneNumber.replace(/\s+/g, '');
      const cacheKey = `${CACHE_KEY_PREFIX}${cleanPhone}`;

      const stored = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(`${cacheKey}_timestamp`);

      if (!stored || !timestamp) {
        return null;
      }

      const cacheAge = Date.now() - parseInt(timestamp);
      const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;

      if (cacheAge > MAX_CACHE_AGE) {
        console.log('[PASS] ⏰ Cache expiré, suppression');
        this.clearCache(phoneNumber);
        return null;
      }

      const subscription = JSON.parse(stored) as PassSubscription;

      if (subscription.endDate < Date.now()) {
        console.log('[PASS] ⏰ Abonnement expiré, suppression du cache');
        this.clearCache(phoneNumber);
        return null;
      }

      console.log('[PASS] 💾 Abonnement chargé depuis le cache:', subscription);
      return subscription;
    } catch (error) {
      console.error('[PASS] ❌ Erreur chargement cache:', error);
      return null;
    }
  },

  clearCache(phoneNumber: string): void {
    try {
      const cleanPhone = phoneNumber.replace(/\s+/g, '');
      const cacheKey = `${CACHE_KEY_PREFIX}${cleanPhone}`;

      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_timestamp`);

      console.log('[PASS] 🗑️ Cache supprimé pour:', cleanPhone);
    } catch (error) {
      console.error('[PASS] ❌ Erreur suppression cache:', error);
    }
  },

  formatPhoneDisplay(phoneNumber: string): string {
    const clean = phoneNumber.replace(/\s+/g, '');

    if (clean.length === 9) {
      return `${clean.substring(0, 2)} *** ${clean.substring(7)}`;
    }

    return phoneNumber;
  },

  getDaysRemaining(endDate: number): number {
    const remaining = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  },

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
};

export default passPhoneService;
