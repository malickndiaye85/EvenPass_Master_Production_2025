/**
 * Service d'authentification pour les contrôleurs Events
 * Gère la validation des codes à 6 chiffres et les sessions
 */

import { getControllerByCode, type Controller } from './opsEventsFirebase';

const CONTROLLER_SESSION_KEY = 'epscanv_controller_session';

export interface ControllerSession {
  controllerId: string;
  controllerName: string;
  controllerCode: string;
  eventId: string;
  eventName: string;
  position: string;
  loginTimestamp: number;
}

/**
 * Authentification par code contrôleur
 */
export async function authenticateController(code: string): Promise<{
  success: boolean;
  session?: ControllerSession;
  error?: string;
}> {
  console.log('[CONTROLLER-AUTH] Authenticating with code:', code);

  try {
    // Validation format
    const normalizedCode = String(code).trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      return { success: false, error: 'Le code doit contenir 6 chiffres' };
    }

    // Recherche du contrôleur dans Firebase
    const controller = await getControllerByCode(normalizedCode);

    if (!controller) {
      console.error('[CONTROLLER-AUTH] Code non trouvé');
      return { success: false, error: 'Code incorrect' };
    }

    // Vérification du statut
    if (!controller.isActive) {
      console.error('[CONTROLLER-AUTH] Contrôleur désactivé');
      return { success: false, error: 'Code désactivé. Contactez le superviseur.' };
    }

    console.log('[CONTROLLER-AUTH] Controller found:', controller.name);

    // Création de la session
    const session: ControllerSession = {
      controllerId: controller.id,
      controllerName: controller.name,
      controllerCode: controller.code,
      eventId: controller.eventId,
      eventName: '', // Sera rempli par l'événement
      position: controller.position,
      loginTimestamp: Date.now()
    };

    // Sauvegarde dans localStorage
    localStorage.setItem(CONTROLLER_SESSION_KEY, JSON.stringify(session));
    console.log('[CONTROLLER-AUTH] Session créée');

    return { success: true, session };

  } catch (error: any) {
    console.error('[CONTROLLER-AUTH] Erreur:', error);
    return {
      success: false,
      error: `Erreur de connexion: ${error?.message || 'Erreur inconnue'}`
    };
  }
}

/**
 * Récupère la session contrôleur active
 */
export function getControllerSession(): ControllerSession | null {
  try {
    const sessionData = localStorage.getItem(CONTROLLER_SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData) as ControllerSession;

    // Vérification validité (24h max)
    const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000;
    if (Date.now() - session.loginTimestamp > MAX_SESSION_DURATION) {
      clearControllerSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('[CONTROLLER-AUTH] Erreur lecture session:', error);
    return null;
  }
}

/**
 * Efface la session contrôleur
 */
export function clearControllerSession(): void {
  localStorage.removeItem(CONTROLLER_SESSION_KEY);
  console.log('[CONTROLLER-AUTH] Session effacée');
}

/**
 * Vérifie si une session contrôleur est active
 */
export function isControllerAuthenticated(): boolean {
  return getControllerSession() !== null;
}

/**
 * Système de vibration
 */
export function vibrateDevice(pattern: number | number[] = 200): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
