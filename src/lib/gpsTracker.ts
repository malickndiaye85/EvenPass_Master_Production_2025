/**
 * SMART GPS TRACKER DEM⇄DEM
 * Throttling adaptatif basé sur vitesse et mouvement
 * Optimise batterie + coûts Firebase Realtime Database
 */

import { ref, set, onDisconnect } from 'firebase/database';
import { database } from './passFirebaseInit';

export interface GPSPosition {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

export enum GPSMode {
  STATIONARY = 120000, // 2 min si arrêté > 2min
  SLOW = 30000, // 30s si vitesse < 20 km/h
  NORMAL = 15000, // 15s si 20-60 km/h
  FAST = 10000, // 10s si > 60 km/h
}

const DELTA_THRESHOLD = 50; // Mètres minimum avant update
const GPS_DECIMALS = 5; // Précision ~1m

class GPSTracker {
  private watchId: number | null = null;
  private lastPosition: GPSPosition | null = null;
  private updateInterval: number = GPSMode.NORMAL;
  private intervalTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private isActive: boolean = false;
  private disconnectLogs: Array<{ timestamp: number; duration: number }> = [];

  /**
   * Démarre le tracking GPS
   */
  start(userId: string, onUpdate?: (position: GPSPosition) => void): void {
    if (this.isActive) {
      console.warn('[GPSTracker] Déjà actif');
      return;
    }

    this.userId = userId;
    this.isActive = true;

    console.log('[GPSTracker] Démarrage tracking pour:', userId);

    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const gpsPos = this.parsePosition(position);

          if (this.shouldUpdate(gpsPos)) {
            this.lastPosition = gpsPos;
            this.adjustInterval(gpsPos.speed);
            this.sendToRealtimeDB(gpsPos);

            if (onUpdate) {
              onUpdate(gpsPos);
            }
          }
        },
        (error) => {
          console.error('[GPSTracker] Erreur GPS:', error);
          this.logDisconnect();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      this.setupDisconnectHandler();
    } else {
      console.error('[GPSTracker] Géolocalisation non supportée');
    }
  }

  /**
   * Arrête le tracking GPS
   */
  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    this.isActive = false;
    console.log('[GPSTracker] Tracking arrêté');
  }

  /**
   * Parse la position native en format DemDem
   */
  private parsePosition(position: GeolocationPosition): GPSPosition {
    return {
      lat: this.roundGPS(position.coords.latitude),
      lng: this.roundGPS(position.coords.longitude),
      speed: position.coords.speed || 0,
      heading: position.coords.heading || 0,
      accuracy: Math.round(position.coords.accuracy),
      timestamp: Date.now(),
    };
  }

  /**
   * Arrondit GPS à 5 décimales (~1m précision)
   */
  private roundGPS(value: number): number {
    return Math.round(value * 100000) / 100000;
  }

  /**
   * Vérifie si on doit envoyer une mise à jour (delta > 50m)
   */
  private shouldUpdate(newPos: GPSPosition): boolean {
    if (!this.lastPosition) return true;

    const distance = this.calculateDistance(
      this.lastPosition.lat,
      this.lastPosition.lng,
      newPos.lat,
      newPos.lng
    );

    return distance >= DELTA_THRESHOLD;
  }

  /**
   * Calcule distance en mètres (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Rayon Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Ajuste l'intervalle de mise à jour selon vitesse
   */
  private adjustInterval(speed: number): void {
    const kmh = (speed || 0) * 3.6;

    let newInterval: number;

    if (kmh < 1) {
      newInterval = GPSMode.STATIONARY;
    } else if (kmh < 20) {
      newInterval = GPSMode.SLOW;
    } else if (kmh < 60) {
      newInterval = GPSMode.NORMAL;
    } else {
      newInterval = GPSMode.FAST;
    }

    if (newInterval !== this.updateInterval) {
      this.updateInterval = newInterval;
      console.log(
        `[GPSTracker] Interval ajusté: ${newInterval / 1000}s (${Math.round(kmh)} km/h)`
      );
    }
  }

  /**
   * Envoie position à Firebase Realtime Database
   */
  private async sendToRealtimeDB(position: GPSPosition): Promise<void> {
    if (!this.userId) return;

    try {
      const positionRef = ref(database, `live/positions/${this.userId}`);
      await set(positionRef, position);
      console.log('[GPSTracker] Position envoyée:', position);
    } catch (error) {
      console.error('[GPSTracker] Erreur envoi RTDB:', error);
    }
  }

  /**
   * Configure le handler de déconnexion
   */
  private setupDisconnectHandler(): void {
    if (!this.userId) return;

    const positionRef = ref(database, `live/positions/${this.userId}`);

    onDisconnect(positionRef).set({
      ...this.lastPosition,
      offline: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Log les déconnexions GPS (anti-fraude)
   */
  private logDisconnect(): void {
    const log = {
      timestamp: Date.now(),
      duration: 0,
    };

    this.disconnectLogs.push(log);

    if (!this.userId) return;

    const logRef = ref(database, `live/gps_logs/${this.userId}/${log.timestamp}`);
    set(logRef, {
      event: 'gps_lost',
      timestamp: log.timestamp,
    }).catch(err => console.error('[GPSTracker] Erreur log:', err));
  }

  /**
   * Récupère les logs de déconnexion
   */
  getDisconnectLogs(): Array<{ timestamp: number; duration: number }> {
    return this.disconnectLogs;
  }

  /**
   * Récupère la dernière position connue
   */
  getLastPosition(): GPSPosition | null {
    return this.lastPosition;
  }

  /**
   * Vérifie si le GPS est actif
   */
  isTracking(): boolean {
    return this.isActive;
  }
}

export const gpsTracker = new GPSTracker();

/**
 * Hook React pour utiliser le GPS tracking
 */
export function useGPSTracker(userId: string | null) {
  const [position, setPosition] = React.useState<GPSPosition | null>(null);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (userId) {
      gpsTracker.start(userId, (pos) => {
        setPosition(pos);
        setIsActive(true);
      });

      return () => {
        gpsTracker.stop();
        setIsActive(false);
      };
    }
  }, [userId]);

  return { position, isActive };
}

import React from 'react';
