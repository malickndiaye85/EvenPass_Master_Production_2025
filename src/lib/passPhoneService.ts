import { db } from '../firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';

export interface PassSubscription {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  status: 'active' | 'expired' | 'cancelled';
  startDate: number;
  endDate: number;
  qrCode: string;
  createdAt: number;
  price: number;
  passengerName?: string;
  passengerPhone?: string;
  routeName?: string;
  subscriptionType?: string;
  subscriptionTier?: string;
  photoUrl?: string;
}

const CACHE_KEY_PREFIX = 'demdem_pass_';

export const passPhoneService = {
  async findSubscriptionByPhone(phoneNumber: string): Promise<PassSubscription | null> {
    try {
      // Nettoyer et normaliser le téléphone
      let cleanPhone = phoneNumber.replace(/[\s+]/g, '');

      // S'assurer que le numéro commence par 221
      if (!cleanPhone.startsWith('221')) {
        cleanPhone = `221${cleanPhone}`;
      }

      console.log('[PASS] 🔍 Recherche abonnement pour:', cleanPhone);

      if (!db) {
        console.error('[PASS] ❌ Firebase Database non initialisée');
        return null;
      }

      // Chercher dans demdem/sama_passes
      const samaPassesRef = ref(db, 'demdem/sama_passes');
      const snapshot = await get(samaPassesRef);

      if (!snapshot.exists()) {
        console.log('[PASS] ❌ Aucun SAMA PASS trouvé dans Firebase');
        return null;
      }

      const allPasses = snapshot.val();
      const now = Date.now();

      // Chercher un pass actif pour ce numéro
      let activeSubscription: PassSubscription | null = null;

      for (const [id, passData] of Object.entries(allPasses)) {
        const pass = passData as any;

        // Vérifier le numéro de téléphone
        const passPhone = pass.passengerPhone || pass.phoneNumber || '';

        if (passPhone === cleanPhone &&
            pass.status === 'active' &&
            pass.expiresAt > now) {

          // Extraire le prénom et nom depuis passengerName
          const [firstName = '', lastName = ''] = (pass.passengerName || '').split(' ');

          activeSubscription = {
            id: pass.id || id,
            phoneNumber: passPhone,
            firstName,
            lastName,
            type: pass.subscriptionType || 'weekly',
            status: pass.status,
            startDate: pass.startDate || pass.createdAt,
            endDate: pass.endDate || pass.expiresAt,
            qrCode: pass.qrCode,
            createdAt: pass.createdAt,
            price: pass.amountPaid || 0,
            passengerName: pass.passengerName,
            passengerPhone: pass.passengerPhone,
            routeName: pass.routeName,
            subscriptionType: pass.subscriptionType,
            subscriptionTier: pass.subscriptionTier,
            photoUrl: pass.photoUrl
          };

          console.log('[PASS] ✅ SAMA PASS trouvé:', activeSubscription);
          console.log('[PASS] 📱 QR Code Firebase:', pass.qrCode);
          break;
        }
      }

      if (!activeSubscription) {
        console.log('[PASS] ❌ Aucun abonnement actif trouvé pour:', cleanPhone);
      }

      return activeSubscription;
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
