interface CachedSubscription {
  id: string;
  subscriber_phone: string;
  subscriber_name: string;
  full_name: string;
  qr_code: string;
  status: string;
  start_date: string;
  end_date: string;
  subscription_type: string;
  vehicle_id?: string;
  cachedAt: number;
}

interface PendingScan {
  id: string;
  subscriptionId: string;
  vehicleId: string;
  timestamp: number;
  scanData: {
    subscriber_phone: string;
    subscriber_name: string;
    qr_code: string;
    subscription_type: string;
  };
  synced: boolean;
}

const DB_NAME = 'epscant_offline_db';
const DB_VERSION = 1;
const SUBSCRIPTIONS_STORE = 'subscriptions';
const PENDING_SCANS_STORE = 'pending_scans';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

class OfflineCacheManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineCache] ✅ IndexedDB initialisée');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(SUBSCRIPTIONS_STORE)) {
          const subsStore = db.createObjectStore(SUBSCRIPTIONS_STORE, { keyPath: 'id' });
          subsStore.createIndex('qr_code', 'qr_code', { unique: false });
          subsStore.createIndex('subscriber_phone', 'subscriber_phone', { unique: false });
          console.log('[OfflineCache] 📦 Store subscriptions créé');
        }

        if (!db.objectStoreNames.contains(PENDING_SCANS_STORE)) {
          const scansStore = db.createObjectStore(PENDING_SCANS_STORE, { keyPath: 'id' });
          scansStore.createIndex('synced', 'synced', { unique: false });
          scansStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('[OfflineCache] 📦 Store pending_scans créé');
        }
      };
    });
  }

  async syncSubscriptionsFromFirebase(abonnementsData: Record<string, any>): Promise<number> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([SUBSCRIPTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SUBSCRIPTIONS_STORE);

    await store.clear();

    const now = Date.now();
    const activeSubscriptions: CachedSubscription[] = [];

    for (const [id, sub] of Object.entries(abonnementsData)) {
      if (sub.status === 'active' && new Date(sub.end_date) > new Date()) {
        activeSubscriptions.push({
          id,
          subscriber_phone: sub.subscriber_phone,
          subscriber_name: sub.subscriber_name,
          full_name: sub.full_name || sub.subscriber_name,
          qr_code: sub.qr_code,
          status: sub.status,
          start_date: sub.start_date,
          end_date: sub.end_date,
          subscription_type: sub.subscription_type,
          vehicle_id: sub.vehicle_id,
          cachedAt: now
        });
      }
    }

    for (const sub of activeSubscriptions) {
      await store.put(sub);
    }

    console.log(`[OfflineCache] ✅ ${activeSubscriptions.length} abonnements synchronisés`);

    localStorage.setItem('last_sync_timestamp', now.toString());
    localStorage.setItem('cached_subscriptions_count', activeSubscriptions.length.toString());

    return activeSubscriptions.length;
  }

  async getSubscriptionByQRCode(qrCode: string): Promise<CachedSubscription | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SUBSCRIPTIONS_STORE], 'readonly');
      const store = transaction.objectStore(SUBSCRIPTIONS_STORE);
      const index = store.index('qr_code');
      const request = index.get(qrCode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getSubscriptionByPhone(phone: string): Promise<CachedSubscription | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SUBSCRIPTIONS_STORE], 'readonly');
      const store = transaction.objectStore(SUBSCRIPTIONS_STORE);
      const index = store.index('subscriber_phone');
      const request = index.get(phone);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.status === 'active' && new Date(result.end_date) > new Date()) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addPendingScan(scan: Omit<PendingScan, 'id' | 'synced'>): Promise<void> {
    if (!this.db) await this.init();

    const pendingScan: PendingScan = {
      ...scan,
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_SCANS_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_SCANS_STORE);
      const request = store.add(pendingScan);

      request.onsuccess = () => {
        console.log('[OfflineCache] 📝 Scan ajouté à la queue:', pendingScan.id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingScans(): Promise<PendingScan[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_SCANS_STORE], 'readonly');
      const store = transaction.objectStore(PENDING_SCANS_STORE);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async markScanAsSynced(scanId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_SCANS_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_SCANS_STORE);
      const getRequest = store.get(scanId);

      getRequest.onsuccess = () => {
        const scan = getRequest.result;
        if (scan) {
          scan.synced = true;
          const putRequest = store.put(scan);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearSyncedScans(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_SCANS_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_SCANS_STORE);
      const index = store.index('synced');
      const request = index.openCursor(true);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SUBSCRIPTIONS_STORE, PENDING_SCANS_STORE], 'readwrite');

      transaction.objectStore(SUBSCRIPTIONS_STORE).clear();
      transaction.objectStore(PENDING_SCANS_STORE).clear();

      transaction.oncomplete = () => {
        console.log('[OfflineCache] 🗑️ Cache vidé');
        localStorage.removeItem('last_sync_timestamp');
        localStorage.removeItem('cached_subscriptions_count');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  getCacheInfo(): { lastSync: number | null; count: number; isExpired: boolean } {
    const lastSync = localStorage.getItem('last_sync_timestamp');
    const count = localStorage.getItem('cached_subscriptions_count');

    const lastSyncTime = lastSync ? parseInt(lastSync) : null;
    const isExpired = lastSyncTime ? (Date.now() - lastSyncTime > CACHE_DURATION) : true;

    return {
      lastSync: lastSyncTime,
      count: count ? parseInt(count) : 0,
      isExpired
    };
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineCache = new OfflineCacheManager();
export type { CachedSubscription, PendingScan };
