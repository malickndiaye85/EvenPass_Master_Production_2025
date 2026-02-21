import { db, auth } from '../firebase';
import { ref, get, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

export interface AccessCodeData {
  code: string;
  type: 'fixe' | 'volant';
  role: 'controller';
  userId?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  name?: string;
  phone?: string;
  active: boolean;
  createdAt: any;
  createdBy: string;
  lastUsedAt?: any;
  usageCount: number;
}

export interface ControllerSession {
  code: string;
  type: 'fixe' | 'volant';
  role: 'controller';
  vehicleId?: string;
  vehiclePlate?: string;
  name?: string;
  phone?: string;
  loginTimestamp: number;
}

const CONTROLLER_SESSION_KEY = 'controller_session';
const FAILED_ATTEMPTS_KEY = 'pin_failed_attempts';

export async function authenticateWithPIN(pinCode: string): Promise<{
  success: boolean;
  session?: ControllerSession;
  error?: string;
}> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 [LOGIN-DEBUG] Démarrage du login PIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Validation du format
    console.log('[LOGIN-DEBUG] Étape 1: Validation format PIN');
    console.log('[LOGIN-DEBUG] PIN reçu:', pinCode);
    console.log('[LOGIN-DEBUG] Type du PIN:', typeof pinCode);
    console.log('[LOGIN-DEBUG] Longueur:', pinCode.length);

    if (pinCode.length !== 6 || !/^\d{6}$/.test(pinCode)) {
      console.error('[LOGIN-DEBUG] ❌ Format invalide');
      logFailedAttempt(pinCode);
      return { success: false, error: 'Le code doit contenir exactement 6 chiffres' };
    }

    console.log('[LOGIN-DEBUG] ✅ Format valide');

    // Normalisation du PIN en string
    const normalizedPin = String(pinCode).trim();
    console.log('[LOGIN-DEBUG] PIN normalisé:', normalizedPin);

    // Recherche dans l'index
    console.log('[LOGIN-DEBUG] Étape 2: Recherche dans Realtime DB');
    const indexPath = `fleet_indices/codes/${normalizedPin}`;
    console.log('[LOGIN-DEBUG] Chemin recherché:', indexPath);

    const pinIndexRef = ref(db, indexPath);
    console.log('[LOGIN-DEBUG] Référence créée:', pinIndexRef.toString());

    console.log('[LOGIN-DEBUG] Tentative de lecture...');
    const pinSnapshot = await get(pinIndexRef);
    console.log('[LOGIN-DEBUG] Lecture terminée');
    console.log('[LOGIN-DEBUG] Snapshot existe?:', pinSnapshot.exists());

    if (!pinSnapshot.exists()) {
      console.error('[LOGIN-DEBUG] ❌ Code non trouvé dans l\'index');
      console.error('[LOGIN-DEBUG] Chemin vérifié:', indexPath);
      console.error('[LOGIN-DEBUG] Suggestion: Vérifier que le véhicule a bien été enrôlé');
      logFailedAttempt(pinCode);
      return { success: false, error: 'Code incorrect' };
    }

    const pinData = pinSnapshot.val();
    console.log('[LOGIN-DEBUG] ✅ Index trouvé: OK');
    console.log('[LOGIN-DEBUG] Données index:', JSON.stringify(pinData, null, 2));
    console.log('[LOGIN-DEBUG] vehicleId:', pinData?.vehicleId);
    console.log('[LOGIN-DEBUG] isActive:', pinData?.isActive);
    console.log('[LOGIN-DEBUG] Type isActive:', typeof pinData?.isActive);

    // Vérification active (convertir en boolean si nécessaire)
    const isActive = pinData.isActive === true || pinData.isActive === 'true' || pinData.isActive === 1;
    console.log('[LOGIN-DEBUG] isActive normalisé:', isActive);

    if (!isActive) {
      console.warn('[LOGIN-DEBUG] ⚠️ Code inactif');
      logFailedAttempt(pinCode);
      return { success: false, error: 'Code désactivé' };
    }

    // Récupération du véhicule
    console.log('[LOGIN-DEBUG] Étape 3: Récupération véhicule');
    const vehiclePath = `fleet_vehicles/${pinData.vehicleId}`;
    console.log('[LOGIN-DEBUG] Chemin véhicule:', vehiclePath);

    const vehicleRef = ref(db, vehiclePath);
    const vehicleSnapshot = await get(vehicleRef);
    console.log('[LOGIN-DEBUG] Véhicule existe?:', vehicleSnapshot.exists());

    if (!vehicleSnapshot.exists()) {
      console.error('[LOGIN-DEBUG] ❌ Véhicule non trouvé');
      console.error('[LOGIN-DEBUG] vehicleId recherché:', pinData.vehicleId);
      return { success: false, error: 'Véhicule non trouvé' };
    }

    const vehicleData = vehicleSnapshot.val();
    console.log('[LOGIN-DEBUG] ✅ Véhicule trouvé: OK');
    console.log('[LOGIN-DEBUG] Données véhicule:', JSON.stringify(vehicleData, null, 2));
    console.log('[LOGIN-DEBUG] Plaque:', vehicleData?.license_plate);
    console.log('[LOGIN-DEBUG] Ligne:', vehicleData?.route);
    console.log('[LOGIN-DEBUG] Chauffeur:', vehicleData?.driver_name);

    // Authentification Firebase
    console.log('[LOGIN-DEBUG] Étape 4: Authentification Firebase');
    try {
      await signInAnonymously(auth);
      console.log('[LOGIN-DEBUG] ✅ Auth anonyme réussie');
    } catch (authError: any) {
      console.error('[LOGIN-DEBUG] ❌ Erreur auth:', authError);
      console.error('[LOGIN-DEBUG] Code erreur:', authError?.code);
      console.error('[LOGIN-DEBUG] Message:', authError?.message);
      throw authError;
    }

    // Mise à jour du compteur
    console.log('[LOGIN-DEBUG] Étape 5: Mise à jour compteur');
    try {
      await update(pinIndexRef, {
        lastUsedAt: new Date().toISOString(),
        usageCount: (pinData.usageCount || 0) + 1
      });
      console.log('[LOGIN-DEBUG] ✅ Compteur mis à jour');
    } catch (updateError: any) {
      console.warn('[LOGIN-DEBUG] ⚠️ Échec mise à jour compteur (non bloquant)');
      console.warn('[LOGIN-DEBUG] Erreur:', updateError?.message);
    }

    // Création de la session
    console.log('[LOGIN-DEBUG] Étape 6: Création session');
    const session: ControllerSession = {
      code: normalizedPin,
      type: 'volant',
      role: 'controller',
      vehicleId: pinData.vehicleId,
      vehiclePlate: pinData.vehiclePlate || vehicleData.license_plate || 'N/A',
      name: vehicleData.driver_name || 'Chauffeur',
      phone: vehicleData.driver_phone || 'N/A',
      loginTimestamp: Date.now()
    };

    console.log('[LOGIN-DEBUG] Session créée:', JSON.stringify(session, null, 2));

    localStorage.setItem(CONTROLLER_SESSION_KEY, JSON.stringify(session));
    console.log('[LOGIN-DEBUG] ✅ Session sauvegardée dans localStorage');

    clearFailedAttempts();
    logSuccessfulLogin(session);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 [LOGIN-DEBUG] LOGIN RÉUSSI!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { success: true, session };

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💥 [LOGIN-DEBUG] ERREUR CRITIQUE');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[LOGIN-DEBUG] Type erreur:', error?.constructor?.name);
    console.error('[LOGIN-DEBUG] Message:', error?.message);
    console.error('[LOGIN-DEBUG] Code:', error?.code);
    console.error('[LOGIN-DEBUG] Stack:', error?.stack);
    console.error('[LOGIN-DEBUG] Erreur complète:', error);

    return {
      success: false,
      error: `Erreur de connexion: ${error?.message || 'Inconnue'}`
    };
  }
}

export function getControllerSession(): ControllerSession | null {
  try {
    const sessionData = localStorage.getItem(CONTROLLER_SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData) as ControllerSession;

    const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000;
    if (Date.now() - session.loginTimestamp > MAX_SESSION_DURATION) {
      clearControllerSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error reading controller session:', error);
    return null;
  }
}

export function clearControllerSession(): void {
  localStorage.removeItem(CONTROLLER_SESSION_KEY);
  auth.signOut().catch(console.error);
}

export function isControllerAuthenticated(): boolean {
  return getControllerSession() !== null;
}

function logFailedAttempt(pinCode: string): void {
  try {
    const attemptsData = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    const attempts = attemptsData ? JSON.parse(attemptsData) : [];

    attempts.push({
      code: pinCode,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });

    if (attempts.length > 50) {
      attempts.shift();
    }

    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(attempts));

    console.warn('[SECURITY] Failed PIN attempt:', {
      code: pinCode.substring(0, 2) + '****',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging failed attempt:', error);
  }
}

function clearFailedAttempts(): void {
  localStorage.removeItem(FAILED_ATTEMPTS_KEY);
}

function logSuccessfulLogin(session: ControllerSession): void {
  console.log('[AUTH] Controller logged in:', {
    type: session.type,
    vehiclePlate: session.vehiclePlate || 'N/A',
    name: session.name || 'N/A',
    timestamp: new Date().toISOString()
  });
}

export function getFailedAttempts(): Array<{ code: string; timestamp: number; userAgent: string }> {
  try {
    const attemptsData = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    return attemptsData ? JSON.parse(attemptsData) : [];
  } catch (error) {
    return [];
  }
}

export function vibrateDevice(pattern: number | number[] = 200): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function openWhatsAppSupport(defaultMessage?: string): void {
  const SUPERVISOR_PHONE = '221771234567';
  const message = defaultMessage || "Bonjour, j'ai oublié mon code d'accès EPscanV. Pouvez-vous m'aider ?";
  const whatsappUrl = `https://wa.me/${SUPERVISOR_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}
