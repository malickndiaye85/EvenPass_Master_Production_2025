/**
 * Service d'authentification AUTONOME pour les apprentis-chauffeurs
 *
 * Philosophie:
 * - Validation 100% LOCALE (aucun appel Firebase au login)
 * - Base de données véhicules hardcodée
 * - Session locale dans localStorage
 * - Tracking des scans par véhicule exact
 */

import { db } from '../firebase';
import { ref, push, serverTimestamp } from 'firebase/database';

const VEHICLE_SESSION_KEY = 'epscanv_vehicle_session';

/**
 * BASE DE DONNÉES LOCALE DES VÉHICULES ENRÔLÉS
 * Ajoutez ici tous les bus avec leur PIN EPscanV
 */
const LOCAL_VEHICLE_DATABASE: Record<string, {
  vehicleId: string;
  vehicle_number: string;
  license_plate: string;
  capacity: number;
  route: string;
  driver_name?: string;
  driver_phone?: string;
}> = {
  '435016': {
    vehicleId: 'VEHICLE_DK2022S',
    vehicle_number: 'DK-2022-S',
    license_plate: 'DK-2022-S',
    capacity: 32,
    route: 'Ligne 7 - Parcelles Assainies',
    driver_name: 'Boubacar Diallo',
    driver_phone: '+221771234567'
  },
  '411546': {
    vehicleId: 'VEHICLE_DK2023T',
    vehicle_number: 'DK-2023-T',
    license_plate: 'DK-2023-T',
    capacity: 35,
    route: 'Ligne 12 - Guédiawaye',
    driver_name: 'Mamadou Sall',
    driver_phone: '+221779876543'
  },
  '789012': {
    vehicleId: 'VEHICLE_DK2024U',
    vehicle_number: 'DK-2024-U',
    license_plate: 'DK-2024-U',
    capacity: 40,
    route: 'Ligne 5 - Pikine',
    driver_name: 'Abdoulaye Ndiaye',
    driver_phone: '+221765432109'
  },
  '345678': {
    vehicleId: 'VEHICLE_DK2024V',
    vehicle_number: 'DK-2024-V',
    license_plate: 'DK-2024-V',
    capacity: 38,
    route: 'Ligne 8 - Rufisque',
    driver_name: 'Cheikh Sy',
    driver_phone: '+221773456789'
  },
  '901234': {
    vehicleId: 'VEHICLE_DK2025W',
    vehicle_number: 'DK-2025-W',
    license_plate: 'DK-2025-W',
    capacity: 42,
    route: 'Ligne 3 - Thiaroye',
    driver_name: 'Moussa Diop',
    driver_phone: '+221776543210'
  }
};

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
 * Authentification par PIN - 100% LOCAL
 * AUCUN appel Firebase pendant le login
 * Validation instantanée contre la base locale
 */
export async function authenticateVehicleByPIN(pinCode: string): Promise<{
  success: boolean;
  session?: VehicleSession;
  error?: string;
}> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚌 [VEHICLE-AUTH] Authentification 100% locale');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Validation format
    const normalizedPin = String(pinCode).trim();
    if (!/^\d{6}$/.test(normalizedPin)) {
      return { success: false, error: 'Le code doit contenir 6 chiffres' };
    }

    console.log('[VEHICLE-AUTH] PIN normalisé:', normalizedPin);

    // Recherche dans la base locale
    const vehicleData = LOCAL_VEHICLE_DATABASE[normalizedPin];

    if (!vehicleData) {
      console.error('[VEHICLE-AUTH] ❌ PIN non trouvé dans la base locale');
      return { success: false, error: 'Code incorrect' };
    }

    console.log('[VEHICLE-AUTH] ✅ Véhicule trouvé:', vehicleData.vehicle_number);

    // Création de la session locale
    const session: VehicleSession = {
      vehicleId: vehicleData.vehicleId,
      vehicleNumber: vehicleData.vehicle_number,
      licensePlate: vehicleData.license_plate,
      capacity: vehicleData.capacity,
      route: vehicleData.route,
      driverName: vehicleData.driver_name || 'Apprenti',
      driverPhone: vehicleData.driver_phone || '',
      loginTimestamp: Date.now(),
      pin: normalizedPin
    };

    // Sauvegarde dans localStorage (source de vérité)
    localStorage.setItem(VEHICLE_SESSION_KEY, JSON.stringify(session));
    console.log('[VEHICLE-AUTH] ✅ Session créée et sauvegardée');
    console.log('[VEHICLE-AUTH] Véhicule:', session.vehicleNumber);
    console.log('[VEHICLE-AUTH] Trajet:', session.route);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 [VEHICLE-AUTH] LOGIN INSTANTANÉ RÉUSSI!');
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
      error: `Erreur de connexion: ${error?.message || 'Erreur inconnue'}`
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
