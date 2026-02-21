/**
 * Service d'authentification AUTONOME pour les apprentis-chauffeurs
 *
 * Philosophie:
 * - Auth anonyme silencieuse (aucune interaction utilisateur)
 * - Validation PIN via SDK Firebase (pas REST)
 * - Session locale dans localStorage
 * - Tracking des scans par véhicule exact
 */

import { db, auth } from '../firebase';
import { ref, push, serverTimestamp, get } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

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
 * Authentification par PIN - Méthode Hybride
 * 1. Auth anonyme silencieuse (donne un token temporaire)
 * 2. Lecture via SDK Firebase (respecte les permissions)
 * 3. Filtrage client-side par PIN
 */
export async function authenticateVehicleByPIN(pinCode: string): Promise<{
  success: boolean;
  session?: VehicleSession;
  error?: string;
}> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚌 [VEHICLE-AUTH] Authentification autonome');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Validation format
    const normalizedPin = String(pinCode).trim();
    if (!/^\d{6}$/.test(normalizedPin)) {
      return { success: false, error: 'Le code doit contenir 6 chiffres' };
    }

    console.log('[VEHICLE-AUTH] PIN normalisé:', normalizedPin);

    // ÉTAPE 1: Auth anonyme silencieuse (donne un jeton temporaire)
    console.log('[VEHICLE-AUTH] Tentative auth anonyme...');
    try {
      if (!auth.currentUser) {
        const userCredential = await signInAnonymously(auth);
        console.log('[VEHICLE-AUTH] ✅ Auth anonyme réussie:', userCredential.user.uid);
      } else {
        console.log('[VEHICLE-AUTH] ✅ Utilisateur déjà authentifié:', auth.currentUser.uid);
      }
    } catch (authError: any) {
      console.warn('[VEHICLE-AUTH] ⚠️ Auth anonyme échouée, on continue quand même');
      console.warn('[VEHICLE-AUTH] Erreur:', authError?.message);
    }

    // ÉTAPE 2: Lecture via SDK Firebase (pas REST)
    console.log('[VEHICLE-AUTH] Lecture fleet_vehicles via SDK...');
    const vehiclesRef = ref(db, 'fleet_vehicles');
    const snapshot = await get(vehiclesRef);

    if (!snapshot.exists()) {
      console.error('[VEHICLE-AUTH] ❌ Aucun véhicule enregistré');
      return { success: false, error: 'Aucun véhicule enregistré' };
    }

    const allVehicles = snapshot.val();
    console.log('[VEHICLE-AUTH] Véhicules récupérés:', Object.keys(allVehicles || {}).length);

    // ÉTAPE 3: Filtrage client-side par PIN
    const matchingEntry = Object.entries(allVehicles).find(([_, vehicle]: [string, any]) => {
      return String(vehicle.epscanv_pin || '').trim() === normalizedPin;
    });

    if (!matchingEntry) {
      console.error('[VEHICLE-AUTH] ❌ PIN non trouvé');
      return { success: false, error: 'Code incorrect' };
    }

    const [vehicleId, vehicleData] = matchingEntry as [string, any];

    // Vérification statut actif
    if (vehicleData.epscanv_active === false) {
      console.warn('[VEHICLE-AUTH] ⚠️ Véhicule inactif');
      return { success: false, error: 'Véhicule désactivé' };
    }

    // ÉTAPE 4: Création de la session locale
    const session: VehicleSession = {
      vehicleId: vehicleId,
      vehicleNumber: vehicleData.vehicle_number || vehicleData.license_plate || 'N/A',
      licensePlate: vehicleData.license_plate || 'N/A',
      capacity: vehicleData.capacity || 0,
      route: vehicleData.route || vehicleData.line || 'N/A',
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
    console.log('🎉 [VEHICLE-AUTH] LOGIN RÉUSSI!');
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
      error: `Erreur de connexion: ${error?.message || 'Réseau indisponible'}`
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
