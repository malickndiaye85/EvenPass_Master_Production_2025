/**
 * CACHE MANAGER DEM⇄DEM
 * Gestion optimisée du cache client (LocalStorage + IndexedDB)
 * Réduit drastiquement les lectures Firebase
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

export const CacheConfig = {
  CITIES_LIST: { ttl: 7 * 24 * 3600000, key: 'demdem_cities' },
  USER_PROFILE: { ttl: 24 * 3600000, key: 'demdem_user_profile' },
  DRIVER_PROFILE: { ttl: 24 * 3600000, key: 'demdem_driver_profile' },
  WALLET_BALANCE: { ttl: 2 * 60000, key: 'demdem_wallet_balance' },
  FLEET_VEHICLES: { ttl: 30 * 60000, key: 'demdem_fleet_vehicles' },
  FLEET_STATS: { ttl: 5 * 60000, key: 'demdem_fleet_stats' },
  BUS_POSITIONS: { ttl: 0, key: 'demdem_bus_positions' },
  SAMA_PASS: { ttl: 24 * 3600000, key: 'demdem_sama_pass' },
  EVENT_LIST: { ttl: 10 * 60000, key: 'demdem_events' },
} as const;

const CACHE_VERSION = '3.1.0';

class CacheManager {
  /**
   * Sauvegarde une entrée dans le cache
   */
  set<T>(key: string, data: T, ttl: number = 0): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };

      const serialized = JSON.stringify(entry);

      if (serialized.length < 5000000) {
        localStorage.setItem(key, serialized);
      } else {
        this.setIndexedDB(key, entry);
      }
    } catch (error) {
      console.warn(`[CacheManager] Erreur sauvegarde cache ${key}:`, error);
    }
  }

  /**
   * Récupère une entrée du cache (si valide)
   */
  get<T>(key: string, ttl: number): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      if (entry.version !== CACHE_VERSION) {
        this.delete(key);
        return null;
      }

      if (ttl > 0) {
        const age = Date.now() - entry.timestamp;
        if (age > ttl) {
          this.delete(key);
          return null;
        }
      }

      return entry.data;
    } catch (error) {
      console.warn(`[CacheManager] Erreur lecture cache ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[CacheManager] Erreur suppression cache ${key}:`, error);
    }
  }

  /**
   * Nettoie tout le cache (logout, changement version)
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('demdem_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('[CacheManager] Cache nettoyé');
    } catch (error) {
      console.warn('[CacheManager] Erreur nettoyage cache:', error);
    }
  }

  /**
   * Sauvegarde dans IndexedDB (gros objets)
   */
  private async setIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const dbName = 'demdem_cache';
      const storeName = 'cache_store';

      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(entry, key);
      };
    } catch (error) {
      console.warn(`[CacheManager] Erreur IndexedDB:`, error);
    }
  }

  /**
   * Récupère depuis IndexedDB
   */
  async getIndexedDB<T>(key: string): Promise<T | null> {
    try {
      const dbName = 'demdem_cache';
      const storeName = 'cache_store';

      return new Promise((resolve) => {
        const request = indexedDB.open(dbName, 1);

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const getRequest = store.get(key);

          getRequest.onsuccess = () => {
            const entry: CacheEntry<T> | undefined = getRequest.result;
            if (entry && entry.version === CACHE_VERSION) {
              resolve(entry.data);
            } else {
              resolve(null);
            }
          };

          getRequest.onerror = () => resolve(null);
        };

        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn(`[CacheManager] Erreur lecture IndexedDB:`, error);
      return null;
    }
  }

  /**
   * Wrapper: Récupère depuis cache ou exécute fonction
   */
  async getOrFetch<T>(
    config: { ttl: number; key: string },
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(config.key, config.ttl);

    if (cached !== null) {
      console.log(`[CacheManager] Hit: ${config.key}`);
      return cached;
    }

    console.log(`[CacheManager] Miss: ${config.key} - Fetching...`);
    const fresh = await fetchFn();
    this.set(config.key, fresh, config.ttl);
    return fresh;
  }

  /**
   * Invalide un cache spécifique (après mutation)
   */
  invalidate(key: string): void {
    this.delete(key);
    console.log(`[CacheManager] Invalidated: ${key}`);
  }

  /**
   * Récupère les stats du cache
   */
  getStats(): { keys: string[]; size: number } {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('demdem_'));
    const size = keys.reduce((acc, key) => {
      const item = localStorage.getItem(key);
      return acc + (item ? item.length : 0);
    }, 0);

    return {
      keys,
      size: Math.round(size / 1024),
    };
  }
}

export const cacheManager = new CacheManager();

/**
 * Hook React pour utiliser le cache
 */
export function useCachedData<T>(
  config: { ttl: number; key: string },
  fetchFn: () => Promise<T>
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    cacheManager
      .getOrFetch(config, fetchFn)
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [config.key]);

  return { data, loading, error };
}

import React from 'react';
