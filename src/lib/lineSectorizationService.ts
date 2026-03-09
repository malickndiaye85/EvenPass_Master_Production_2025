import { ref, get, update } from 'firebase/database';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface LineSession {
  lineId: string;
  lineName: string;
  lineRoute: string;
  vehicleId: string;
  vehiclePlate: string;
  accessCode: string;
  controllerName?: string;
  sessionStarted: number;
}

export interface ScanValidationResult {
  isValid: boolean;
  isAuthorized: boolean;
  message: string;
  passengerInfo?: {
    name: string;
    phone: string;
    tier: string;
    expiresAt: number;
  };
  lineInfo?: {
    subscriberLine: string;
    controllerLine: string;
  };
}

export class LineSectorizationService {
  private static SESSION_KEY = 'epscant_line_session';

  /**
   * Authentifie un contrôleur avec son code d'accès et établit la ligne active
   */
  static async authenticateWithAccessCode(accessCode: string): Promise<LineSession | null> {
    console.log('[SECTORISATION] 🔐 Authentification avec code d\'accès:', accessCode);

    try {
      // 1. VÉRIFIER LE CODE D'ACCÈS DANS FIRESTORE
      const accessCodeRef = doc(db, 'access_codes', accessCode);
      const accessCodeSnap = await getDoc(accessCodeRef);

      if (!accessCodeSnap.exists()) {
        console.error('[SECTORISATION] ❌ Code d\'accès invalide');
        return null;
      }

      const accessData = accessCodeSnap.data();

      if (!accessData.isActive) {
        console.error('[SECTORISATION] ❌ Code d\'accès désactivé');
        return null;
      }

      if (accessData.type !== 'vehicle') {
        console.error('[SECTORISATION] ❌ Ce code n\'est pas lié à un véhicule');
        return null;
      }

      const vehicleId = accessData.vehicleId;
      const vehiclePlate = accessData.vehiclePlate;

      console.log('[SECTORISATION] ✅ Code valide pour véhicule:', vehiclePlate);

      // 2. RÉCUPÉRER LE VÉHICULE ET SA LIGNE DANS FIREBASE REALTIME DATABASE
      const vehicleRef = ref(db, `ops/transport/vehicles/${vehicleId}`);
      const vehicleSnap = await get(vehicleRef);

      if (!vehicleSnap.exists()) {
        console.error('[SECTORISATION] ❌ Véhicule non trouvé dans ops/transport/vehicles');
        return null;
      }

      const vehicleData = vehicleSnap.val();
      const lineId = vehicleData.line_id || vehicleData.lineId;

      if (!lineId) {
        console.error('[SECTORISATION] ❌ Véhicule non assigné à une ligne');
        return null;
      }

      console.log('[SECTORISATION] 🚍 Véhicule assigné à la ligne:', lineId);

      // 3. RÉCUPÉRER LES INFOS DE LA LIGNE
      const lineRef = ref(db, `transport_lines/${lineId}`);
      const lineSnap = await get(lineRef);

      if (!lineSnap.exists()) {
        console.error('[SECTORISATION] ❌ Ligne non trouvée dans transport_lines');
        return null;
      }

      const lineData = lineSnap.val();

      if (!lineData.is_active) {
        console.error('[SECTORISATION] ❌ Ligne désactivée');
        return null;
      }

      const lineName = lineData.name;
      const lineRoute = lineData.route;

      console.log('[SECTORISATION] ✅ Ligne active:', lineName);
      console.log('[SECTORISATION] 📍 Trajet:', lineRoute);

      // 4. CRÉER LA SESSION DE LIGNE
      const session: LineSession = {
        lineId,
        lineName,
        lineRoute,
        vehicleId,
        vehiclePlate,
        accessCode,
        controllerName: accessData.staffName,
        sessionStarted: Date.now()
      };

      // 5. STOCKER LA SESSION LOCALEMENT
      this.saveSession(session);

      console.log('[SECTORISATION] ✅ Session établie:', session);

      return session;
    } catch (error) {
      console.error('[SECTORISATION] ❌ Erreur lors de l\'authentification:', error);
      return null;
    }
  }

  /**
   * Valide si un abonnement SAMA PASS est autorisé sur la ligne active
   */
  static async validateSubscriptionForLine(
    subscriptionId: string,
    session: LineSession
  ): Promise<ScanValidationResult> {
    console.log('[SECTORISATION] 🔍 Validation abonnement:', subscriptionId);
    console.log('[SECTORISATION] 📍 Ligne active:', session.lineName);

    try {
      // 1. RÉCUPÉRER L'ABONNEMENT DEPUIS FIREBASE
      const subRef = ref(db, `demdem/sama_passes/${subscriptionId}`);
      const subSnap = await get(subRef);

      if (!subSnap.exists()) {
        return {
          isValid: false,
          isAuthorized: false,
          message: 'ABONNEMENT NON TROUVÉ'
        };
      }

      const subData = subSnap.val();

      // 2. VÉRIFIER LA VALIDITÉ DE L'ABONNEMENT
      const now = Date.now();
      const expiresAt = subData.expiresAt || subData.endDate;

      if (subData.status !== 'active') {
        return {
          isValid: false,
          isAuthorized: false,
          message: 'ABONNEMENT INACTIF'
        };
      }

      if (expiresAt < now) {
        return {
          isValid: false,
          isAuthorized: false,
          message: 'ABONNEMENT EXPIRÉ'
        };
      }

      // 3. VÉRIFIER LA SECTORISATION PAR LIGNE
      const subscriberRouteId = subData.routeId;
      const subscriberRouteName = subData.routeName;

      console.log('[SECTORISATION] 📋 Ligne abonné:', subscriberRouteName);
      console.log('[SECTORISATION] 📋 Route ID abonné:', subscriberRouteId);
      console.log('[SECTORISATION] 📋 Ligne contrôleur:', session.lineName);
      console.log('[SECTORISATION] 📋 Line ID contrôleur:', session.lineId);

      // COMPARAISON STRICTE : L'ID de la ligne doit correspondre
      const isLineMatch = subscriberRouteId === session.lineId;

      if (!isLineMatch) {
        return {
          isValid: true,
          isAuthorized: false,
          message: `LIGNE NON AUTORISÉE. Ce pass est valide uniquement pour la ligne ${subscriberRouteName}`,
          passengerInfo: {
            name: subData.passengerName,
            phone: subData.passengerPhone,
            tier: subData.subscriptionTier || 'ECO',
            expiresAt
          },
          lineInfo: {
            subscriberLine: subscriberRouteName,
            controllerLine: session.lineName
          }
        };
      }

      // 4. VALIDATION RÉUSSIE - INCRÉMENTER LES STATS
      await this.incrementLineStats(session.lineId, session.vehicleId);

      return {
        isValid: true,
        isAuthorized: true,
        message: 'VALIDE',
        passengerInfo: {
          name: subData.passengerName,
          phone: subData.passengerPhone,
          tier: subData.subscriptionTier || 'ECO',
          expiresAt
        },
        lineInfo: {
          subscriberLine: subscriberRouteName,
          controllerLine: session.lineName
        }
      };
    } catch (error) {
      console.error('[SECTORISATION] ❌ Erreur validation:', error);
      return {
        isValid: false,
        isAuthorized: false,
        message: 'ERREUR DE VALIDATION'
      };
    }
  }

  /**
   * Incrémente les statistiques de la ligne et du véhicule
   */
  static async incrementLineStats(lineId: string, vehicleId: string): Promise<void> {
    console.log('[SECTORISATION] 📊 Mise à jour stats ligne:', lineId);

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. INCRÉMENTER LES STATS DE LA LIGNE
      const lineStatsRef = ref(db, `ops/transport/lines/${lineId}/stats`);
      const lineStatsSnap = await get(lineStatsRef);

      const currentLineStats = lineStatsSnap.exists() ? lineStatsSnap.val() : {};
      const scansToday = (currentLineStats.scans_today || 0) + 1;
      const totalScans = (currentLineStats.total_scans || 0) + 1;

      await update(lineStatsRef, {
        scans_today: scansToday,
        total_scans: totalScans,
        last_scan: Date.now(),
        last_scan_date: today
      });

      console.log('[SECTORISATION] ✅ Stats ligne mises à jour:', { scansToday, totalScans });

      // 2. INCRÉMENTER LES STATS DU VÉHICULE
      const vehicleStatsRef = ref(db, `ops/transport/vehicles/${vehicleId}/stats`);
      const vehicleStatsSnap = await get(vehicleStatsRef);

      const currentVehicleStats = vehicleStatsSnap.exists() ? vehicleStatsSnap.val() : {};
      const vehicleScansToday = (currentVehicleStats.scans_today || 0) + 1;
      const vehicleTotalScans = (currentVehicleStats.total_scans || 0) + 1;

      await update(vehicleStatsRef, {
        scans_today: vehicleScansToday,
        total_scans: vehicleTotalScans,
        last_scan: Date.now(),
        last_scan_date: today
      });

      console.log('[SECTORISATION] ✅ Stats véhicule mises à jour:', { vehicleScansToday, vehicleTotalScans });

      // 3. CALCULER LE TAUX D'OCCUPATION (estimation)
      // Note: Ce serait mieux avec la capacité réelle du véhicule
      const capacity = 50; // Capacité par défaut
      const occupancyRate = Math.min(100, Math.round((vehicleScansToday / capacity) * 100));

      await update(vehicleStatsRef, {
        occupancy_rate: occupancyRate
      });

      console.log('[SECTORISATION] 📊 Taux d\'occupation:', occupancyRate + '%');
    } catch (error) {
      console.error('[SECTORISATION] ❌ Erreur mise à jour stats:', error);
    }
  }

  /**
   * Sauvegarde la session dans localStorage
   */
  static saveSession(session: LineSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    console.log('[SECTORISATION] 💾 Session sauvegardée localement');
  }

  /**
   * Récupère la session active
   */
  static getSession(): LineSession | null {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    try {
      return JSON.parse(sessionData) as LineSession;
    } catch {
      return null;
    }
  }

  /**
   * Efface la session
   */
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    console.log('[SECTORISATION] 🗑️ Session effacée');
  }

  /**
   * Vérifie si une session est active
   */
  static hasActiveSession(): boolean {
    return this.getSession() !== null;
  }
}
