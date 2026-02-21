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
  try {
    if (pinCode.length !== 6 || !/^\d{6}$/.test(pinCode)) {
      logFailedAttempt(pinCode);
      return { success: false, error: 'Le code doit contenir exactement 6 chiffres' };
    }

    console.log('🔍 [PIN AUTH] Recherche du PIN dans Realtime DB:', pinCode);

    // Recherche dans l'index des codes
    const pinIndexRef = ref(db, `fleet_indices/codes/${pinCode}`);
    const pinSnapshot = await get(pinIndexRef);

    if (!pinSnapshot.exists()) {
      console.warn('❌ [PIN AUTH] Code non trouvé dans l\'index');
      logFailedAttempt(pinCode);
      return { success: false, error: 'Code incorrect' };
    }

    const pinData = pinSnapshot.val();
    console.log('✅ [PIN AUTH] Code trouvé:', pinData);

    if (!pinData.isActive) {
      console.warn('⚠️ [PIN AUTH] Code inactif');
      logFailedAttempt(pinCode);
      return { success: false, error: 'Code désactivé' };
    }

    // Récupérer les données du véhicule
    const vehicleRef = ref(db, `fleet_vehicles/${pinData.vehicleId}`);
    const vehicleSnapshot = await get(vehicleRef);

    if (!vehicleSnapshot.exists()) {
      console.error('❌ [PIN AUTH] Véhicule non trouvé:', pinData.vehicleId);
      return { success: false, error: 'Véhicule non trouvé' };
    }

    const vehicleData = vehicleSnapshot.val();
    console.log('✅ [PIN AUTH] Véhicule trouvé:', vehicleData);

    // Authentification anonyme
    await signInAnonymously(auth);

    // Mise à jour du compteur d'utilisation
    try {
      await update(pinIndexRef, {
        lastUsedAt: new Date().toISOString(),
        usageCount: (pinData.usageCount || 0) + 1
      });
    } catch (updateError) {
      console.warn('⚠️ [PIN AUTH] Impossible de mettre à jour le compteur:', updateError);
    }

    const session: ControllerSession = {
      code: pinCode,
      type: 'volant',
      role: 'controller',
      vehicleId: pinData.vehicleId,
      vehiclePlate: pinData.vehiclePlate || vehicleData.license_plate,
      name: vehicleData.driver_name,
      phone: vehicleData.driver_phone,
      loginTimestamp: Date.now()
    };

    localStorage.setItem(CONTROLLER_SESSION_KEY, JSON.stringify(session));
    clearFailedAttempts();

    logSuccessfulLogin(session);

    console.log('🎉 [PIN AUTH] Authentification réussie');
    return { success: true, session };
  } catch (error) {
    console.error('❌ [PIN AUTH] Erreur:', error);
    return { success: false, error: 'Erreur de connexion. Veuillez réessayer.' };
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
