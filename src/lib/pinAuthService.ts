import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
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

    const accessCodesRef = collection(db, 'access_codes');
    const q = query(
      accessCodesRef,
      where('code', '==', pinCode),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      logFailedAttempt(pinCode);
      return { success: false, error: 'Code incorrect' };
    }

    const codeDoc = querySnapshot.docs[0];
    const codeData = codeDoc.data() as AccessCodeData;

    await signInAnonymously(auth);

    await updateDoc(doc(db, 'access_codes', codeDoc.id), {
      lastUsedAt: Timestamp.now(),
      usageCount: increment(1)
    });

    const session: ControllerSession = {
      code: codeData.code,
      type: codeData.type,
      role: codeData.role,
      vehicleId: codeData.vehicleId,
      vehiclePlate: codeData.vehiclePlate,
      name: codeData.name,
      phone: codeData.phone,
      loginTimestamp: Date.now()
    };

    localStorage.setItem(CONTROLLER_SESSION_KEY, JSON.stringify(session));
    clearFailedAttempts();

    logSuccessfulLogin(session);

    return { success: true, session };
  } catch (error) {
    console.error('PIN authentication error:', error);
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
