import { db, auth } from '../firebase';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
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
  line?: string;
  route?: string;
  vehicleData?: any;
  adminName?: string;
  adminPhone?: string;
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

    // BYPASS MODE pour test (code hardcoded)
    if (normalizedPin === '999999') {
      console.warn('[LOGIN-DEBUG] 🔓 MODE BYPASS ACTIVÉ - Code de test détecté');
      const bypassSession: ControllerSession = {
        code: normalizedPin,
        type: 'volant',
        role: 'controller',
        vehicleId: 'TEST_VEHICLE',
        vehiclePlate: 'TEST-123',
        name: 'Mode Test',
        phone: 'N/A',
        loginTimestamp: Date.now()
      };
      localStorage.setItem(CONTROLLER_SESSION_KEY, JSON.stringify(bypassSession));
      console.log('[LOGIN-DEBUG] ✅ Session bypass créée');
      return { success: true, session: bypassSession };
    }

    // Vérification de l'état d'authentification
    console.log('[LOGIN-DEBUG] Étape 2: Vérification authentification');
    console.log('[LOGIN-DEBUG] Auth currentUser:', auth.currentUser?.uid || 'Non connecté');

    // Si pas d'utilisateur, on se connecte anonymement
    if (!auth.currentUser) {
      console.log('[LOGIN-DEBUG] Connexion anonyme...');
      try {
        await signInAnonymously(auth);
        console.log('[LOGIN-DEBUG] ✅ Auth anonyme réussie');
      } catch (authError: any) {
        console.error('[LOGIN-DEBUG] ❌ Erreur auth anonyme:', authError);
      }
    }

    let pinData: any = null;
    let vehicleData: any = null;
    let vehicleId: string | null = null;

    // MÉTHODE 1: Tentative de lecture de l'index (si accessible)
    console.log('[LOGIN-DEBUG] Étape 3A: Tentative lecture index fleet_indices');
    try {
      const indexPath = `fleet_indices/codes/${normalizedPin}`;
      console.log('[LOGIN-DEBUG] Chemin index:', indexPath);

      const pinIndexRef = ref(db, indexPath);
      const pinSnapshot = await get(pinIndexRef);

      if (pinSnapshot.exists()) {
        pinData = pinSnapshot.val();
        console.log('[LOGIN-DEBUG] ✅ Index trouvé via fleet_indices');
        console.log('[LOGIN-DEBUG] Données:', JSON.stringify(pinData, null, 2));
        vehicleId = pinData.vehicleId;
      } else {
        console.warn('[LOGIN-DEBUG] ⚠️ Index non trouvé, passage au fallback');
      }
    } catch (indexError: any) {
      console.warn('[LOGIN-DEBUG] ⚠️ Erreur lecture index (Permission denied?)');
      console.warn('[LOGIN-DEBUG] Code erreur:', indexError?.code);
      console.warn('[LOGIN-DEBUG] Message:', indexError?.message);
      console.warn('[LOGIN-DEBUG] Passage au fallback...');
    }

    // MÉTHODE 2 (FALLBACK): Lecture complète + filtrage côté client (BYPASS INDEX)
    if (!vehicleId) {
      console.log('[LOGIN-DEBUG] Étape 3B: FALLBACK - Lecture complète + filtrage client');
      try {
        const vehiclesRef = ref(db, 'fleet_vehicles');
        console.log('[LOGIN-DEBUG] Lecture de tous les véhicules...');

        const allVehiclesSnapshot = await get(vehiclesRef);

        if (!allVehiclesSnapshot.exists()) {
          console.error('[LOGIN-DEBUG] ❌ Aucun véhicule dans la DB');
          logFailedAttempt(pinCode);
          return { success: false, error: 'Aucun véhicule enregistré' };
        }

        const allVehicles = allVehiclesSnapshot.val();
        console.log('[LOGIN-DEBUG] Véhicules trouvés:', Object.keys(allVehicles).length);

        // Filtrage côté client (BYPASS de l'index DB)
        const matchingVehicle = Object.entries(allVehicles).find(([id, vehicle]: [string, any]) => {
          const vehiclePin = String(vehicle.epscanv_pin || '').trim();
          const matches = vehiclePin === normalizedPin;

          if (matches) {
            console.log('[LOGIN-DEBUG] 🎯 Match trouvé! VehicleId:', id);
            console.log('[LOGIN-DEBUG] PIN véhicule:', vehiclePin);
            console.log('[LOGIN-DEBUG] Plaque:', vehicle.license_plate);
          }

          return matches;
        });

        if (!matchingVehicle) {
          console.error('[LOGIN-DEBUG] ❌ Aucun véhicule avec ce PIN (filtrage client)');
          console.error('[LOGIN-DEBUG] PINs disponibles dans la DB:',
            Object.values(allVehicles)
              .map((v: any) => v.epscanv_pin)
              .filter(Boolean)
              .slice(0, 5)
          );
          logFailedAttempt(pinCode);
          return { success: false, error: 'Code incorrect' };
        }

        const [foundVehicleId, foundVehicleData] = matchingVehicle;
        vehicleId = foundVehicleId;
        vehicleData = foundVehicleData;

        console.log('[LOGIN-DEBUG] ✅ Véhicule trouvé via filtrage client!');
        console.log('[LOGIN-DEBUG] VehicleId:', vehicleId);
        console.log('[LOGIN-DEBUG] Données véhicule:', JSON.stringify(vehicleData, null, 2));

        // Reconstituer pinData à partir du véhicule
        pinData = {
          vehicleId: vehicleId,
          isActive: vehicleData.epscanv_active !== false,
          vehiclePlate: vehicleData.license_plate,
          usageCount: vehicleData.epscanv_usage_count || 0
        };

      } catch (fallbackError: any) {
        console.error('[LOGIN-DEBUG] ❌ Erreur recherche fallback');
        console.error('[LOGIN-DEBUG] Code:', fallbackError?.code);
        console.error('[LOGIN-DEBUG] Message:', fallbackError?.message);
        throw fallbackError;
      }
    }

    // Vérification que nous avons bien un vehicleId
    if (!vehicleId) {
      console.error('[LOGIN-DEBUG] ❌ Impossible de trouver le véhicule');
      logFailedAttempt(pinCode);
      return { success: false, error: 'Code incorrect' };
    }

    // Vérification active
    const isActive = pinData.isActive === true || pinData.isActive === 'true' || pinData.isActive === 1 || pinData.isActive !== false;
    console.log('[LOGIN-DEBUG] Code actif?:', isActive);

    if (!isActive) {
      console.warn('[LOGIN-DEBUG] ⚠️ Code inactif');
      logFailedAttempt(pinCode);
      return { success: false, error: 'Code désactivé' };
    }

    // Si on n'a pas encore les données du véhicule, les récupérer
    if (!vehicleData) {
      console.log('[LOGIN-DEBUG] Étape 4: Récupération données véhicule');
      const vehiclePath = `fleet_vehicles/${vehicleId}`;
      console.log('[LOGIN-DEBUG] Chemin:', vehiclePath);

      const vehicleRef = ref(db, vehiclePath);
      const vehicleSnapshot = await get(vehicleRef);

      if (!vehicleSnapshot.exists()) {
        console.error('[LOGIN-DEBUG] ❌ Véhicule non trouvé');
        return { success: false, error: 'Véhicule non trouvé' };
      }

      vehicleData = vehicleSnapshot.val();
      console.log('[LOGIN-DEBUG] ✅ Véhicule récupéré');
    }

    console.log('[LOGIN-DEBUG] Données finales véhicule:');
    console.log('[LOGIN-DEBUG] - Plaque:', vehicleData?.license_plate);
    console.log('[LOGIN-DEBUG] - Ligne:', vehicleData?.route);
    console.log('[LOGIN-DEBUG] - Chauffeur:', vehicleData?.driver_name);

    // Mise à jour du compteur (non bloquant)
    console.log('[LOGIN-DEBUG] Étape 5: Mise à jour compteur');
    try {
      const pinIndexRef = ref(db, `fleet_indices/codes/${normalizedPin}`);
      await update(pinIndexRef, {
        lastUsedAt: new Date().toISOString(),
        usageCount: (pinData.usageCount || 0) + 1
      });
      console.log('[LOGIN-DEBUG] ✅ Compteur mis à jour');
    } catch (updateError: any) {
      console.warn('[LOGIN-DEBUG] ⚠️ Échec mise à jour compteur (non bloquant)');
    }

    // Création de la session enrichie
    console.log('[LOGIN-DEBUG] Étape 6: Création session enrichie');
    const session: ControllerSession = {
      code: normalizedPin,
      type: 'volant',
      role: 'controller',
      vehicleId: vehicleId,
      vehiclePlate: pinData.vehiclePlate || vehicleData.license_plate || 'N/A',
      name: vehicleData.driver_name || 'Chauffeur',
      phone: vehicleData.driver_phone || 'N/A',
      line: vehicleData.route || vehicleData.line || 'N/A',
      route: vehicleData.route || 'N/A',
      vehicleData: vehicleData,
      adminName: 'Malick',
      adminPhone: '+221 77 123 45 67',
      loginTimestamp: Date.now()
    };

    console.log('[LOGIN-DEBUG] Session créée:', JSON.stringify(session, null, 2));

    localStorage.setItem(CONTROLLER_SESSION_KEY, JSON.stringify(session));
    console.log('[LOGIN-DEBUG] ✅ Session enrichie sauvegardée dans localStorage');

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
