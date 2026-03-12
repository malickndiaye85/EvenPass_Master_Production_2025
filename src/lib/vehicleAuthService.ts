/**
 * Service d'authentification pour les véhicules transport DEM-DEM Express
 *
 * Philosophie:
 * - Validation via Firebase Realtime Database
 * - Base de données véhicules dans /transport/vehicles
 * - Session locale dans localStorage
 * - Tracking des scans par véhicule exact
 * - Scalable pour centaines de véhicules
 */

import { db } from '../firebase';
import { ref, push, serverTimestamp, get } from 'firebase/database';

const VEHICLE_SESSION_KEY = 'epscanv_vehicle_session';

export interface VehicleSession {
  vehicleId: string;
  vehicleNumber: string;
  licensePlate: string;
  capacity: number;
  route: string;
  driverName?: string;
  driverPhone?: string;
  loginTimestamp: number;
  pin: string;
}

/**
 * Authentification par PIN via Firebase Realtime Database
 * Scalable pour centaines de véhicules
 */
export async function authenticateVehicleByPIN(pinCode: string): Promise<{
  success: boolean;
  session?: VehicleSession;
  error?: string;
}> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚌 [VEHICLE-AUTH] Authentification Firebase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const normalizedPin = String(pinCode).trim();
    if (!/^\d{6}$/.test(normalizedPin)) {
      return { success: false, error: 'Le code doit contenir 6 chiffres' };
    }

    console.log('[VEHICLE-AUTH] PIN normalisé:', normalizedPin);

    const vehiclesRef = ref(db, 'transport/vehicles');
    const snapshot = await get(vehiclesRef);

    if (!snapshot.exists()) {
      console.warn('[VEHICLE-AUTH] ⚠️ Aucun véhicule dans Firebase');
      return { success: false, error: 'Aucun véhicule enregistré' };
    }

    const vehicles = snapshot.val();
    let foundVehicle: any = null;
    let foundVehicleId: string | null = null;

    for (const [vehicleId, vehicleData] of Object.entries(vehicles as Record<string, any>)) {
      if (vehicleData.pin === normalizedPin && vehicleData.isActive) {
        foundVehicle = vehicleData;
        foundVehicleId = vehicleId;
        break;
      }
    }

    if (!foundVehicle || !foundVehicleId) {
      console.error('[VEHICLE-AUTH] ❌ PIN non trouvé ou véhicule inactif');
      return { success: false, error: 'Code incorrect ou véhicule inactif' };
    }

    console.log('[VEHICLE-AUTH] ✅ Véhicule trouvé:', foundVehicle.licensePlate);

    const session: VehicleSession = {
      vehicleId: foundVehicleId,
      vehicleNumber: foundVehicle.licensePlate || foundVehicleId,
      licensePlate: foundVehicle.licensePlate,
      capacity: foundVehicle.capacity || 0,
      route: foundVehicle.route || 'DEM-DEM Express',
      driverName: foundVehicle.driverName || 'Chauffeur',
      driverPhone: foundVehicle.driverPhone || '',
      loginTimestamp: Date.now(),
      pin: normalizedPin
    };

    localStorage.setItem(VEHICLE_SESSION_KEY, JSON.stringify(session));
    console.log('[VEHICLE-AUTH] ✅ Session créée:', session.vehicleNumber);

    const sessionRef = ref(db, `transport/sessions/${foundVehicleId}`);
    await push(sessionRef, {
      lastLogin: serverTimestamp(),
      deviceId: 'web-app',
      isOnline: true
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 [VEHICLE-AUTH] LOGIN FIREBASE RÉUSSI!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { success: true, session };

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💥 [VEHICLE-AUTH] ERREUR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[VEHICLE-AUTH] Message:', error?.message);
    console.error('[VEHICLE-AUTH] Stack:', error?.stack);

    return {
      success: false,
      error: `Erreur système: ${error?.message || 'Erreur inconnue'}`
    };
  }
}

/**
 * Récupère la session véhicule active
 */
export function getVehicleSession(): VehicleSession | null {
  try {
    const sessionData = localStorage.getItem(VEHICLE_SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData) as VehicleSession;

    // Vérification validité (24h max)
    const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000;
    if (Date.now() - session.loginTimestamp > MAX_SESSION_DURATION) {
      clearVehicleSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('[VEHICLE-AUTH] Erreur lecture session:', error);
    return null;
  }
}

/**
 * Efface la session véhicule
 */
export function clearVehicleSession(): void {
  localStorage.removeItem(VEHICLE_SESSION_KEY);
  console.log('[VEHICLE-AUTH] Session effacée');
}

/**
 * Vérifie si une session véhicule est active
 */
export function isVehicleAuthenticated(): boolean {
  return getVehicleSession() !== null;
}

/**
 * Enregistre un scan avec tracking par véhicule
 * Structure: /scans/{vehicleId}/{date}/{scanId}
 */
export async function recordVehicleScan(scanData: {
  passData: any;
  result: 'validated' | 'rejected';
  reason?: string;
  location?: { latitude: number; longitude: number };
}): Promise<void> {
  const session = getVehicleSession();
  if (!session) {
    console.warn('[VEHICLE-AUTH] Impossible d\'enregistrer le scan - pas de session');
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const scanPath = `scans/${session.vehicleId}/${today}`;
    const scansRef = ref(db, scanPath);

    const scanRecord = {
      vehicleId: session.vehicleId,
      vehicleNumber: session.vehicleNumber,
      route: session.route,
      passengerId: scanData.passData?.userId || 'unknown',
      subscriptionType: scanData.passData?.subscriptionType || 'N/A',
      grade: scanData.passData?.grade || 'N/A',
      result: scanData.result,
      reason: scanData.reason || null,
      timestamp: serverTimestamp(),
      location: scanData.location || null,
      scannedBy: session.driverName || 'Apprenti'
    };

    await push(scansRef, scanRecord);
    console.log('[VEHICLE-AUTH] ✅ Scan enregistré:', scanPath);
  } catch (error) {
    console.error('[VEHICLE-AUTH] ❌ Erreur enregistrement scan:', error);
    throw error;
  }
}

/**
 * Système de vibration
 */
export function vibrateDevice(pattern: number | number[] = 200): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Support WhatsApp
 */
export function openWhatsAppSupport(defaultMessage?: string): void {
  const SUPERVISOR_PHONE = '221771234567';
  const message = defaultMessage || "Bonjour, j'ai oublié mon code d'accès EPscanV. Pouvez-vous m'aider ?";
  const whatsappUrl = `https://wa.me/${SUPERVISOR_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}
