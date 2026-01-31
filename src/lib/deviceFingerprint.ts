const DB_NAME = 'DemDem Transports & EventsSecure';
const DB_VERSION = 1;
const STORE_NAME = 'deviceFingerprint';
const FINGERPRINT_KEY = 'hardware_uuid';

class DeviceFingerprintService {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private generateUUID(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async getDeviceFingerprint(): Promise<string> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(FINGERPRINT_KEY);

      getRequest.onsuccess = () => {
        const existingFingerprint = getRequest.result;

        if (existingFingerprint) {
          resolve(existingFingerprint);
        } else {
          const newFingerprint = this.generateUUID();
          const putRequest = store.put(newFingerprint, FINGERPRINT_KEY);

          putRequest.onsuccess = () => {
            resolve(newFingerprint);
          };

          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  async clearFingerprint(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(FINGERPRINT_KEY);

      deleteRequest.onsuccess = () => {
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    });
  }

  async hasFingerprint(): Promise<boolean> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(FINGERPRINT_KEY);

      getRequest.onsuccess = () => {
        resolve(!!getRequest.result);
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  getDeviceInfo(): string {
    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
    };
    return JSON.stringify(info, null, 2);
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();
