/**
 * Service de Validation SAMA PASS pour EPscanT
 *
 * Gère la validation des abonnements DEM-DEM Express
 * pour les scanners de transport
 *
 * Date: 2026-03-05
 */

import { ref, get, push, set } from 'firebase/database';
import { db } from '../firebase';

export interface SamaPassSubscription {
  id: string;
  subscriber_phone: string;
  full_name: string;
  subscription_type: 'weekly' | 'monthly' | 'quarterly';
  subscription_tier: 'eco' | 'prestige';
  route_id: string;
  route_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'suspended';
  qr_code: string;
  created_at: string;
  photo_url?: string;
}

export interface ScanValidationResult {
  isValid: boolean;
  status: 'valid' | 'expired' | 'invalid' | 'not_found' | 'wrong_line' | 'quota_exceeded' | 'too_soon';
  message: string;
  subscription?: SamaPassSubscription;
  color: 'green' | 'orange' | 'red';
  scansToday?: number;
  lastScanTime?: string;
  expectedLine?: string;
}

export interface TransportScanRecord {
  vehicleId: string;
  timestamp: string;
  passengerPhone: string;
  passengerName: string;
  subscriptionType: string;
  subscriptionTier: string;
  routeName: string;
  scanStatus: 'valid' | 'expired' | 'invalid';
  scannedBy?: string;
}

/**
 * Valide un QR Code SAMA PASS avec contrôles de sécurité renforcés
 */
export async function validateSamaPass(
  qrCode: string,
  vehicleId: string,
  vehicleLineId?: string
): Promise<ScanValidationResult> {

  console.log(`[SAMA-PASS-SCAN] 📱 Validation QR: ${qrCode.substring(0, 20)}...`);
  console.log(`[SAMA-PASS-SCAN] 🚍 Véhicule: ${vehicleId}, Ligne: ${vehicleLineId || 'NON SPÉCIFIÉE'}`);

  try {
    // 1. Chercher l'abonnement dans abonnements_express
    const subscription = await findSubscriptionByQR(qrCode);

    if (!subscription) {
      // Tentative de validation par numéro de téléphone (mode hors-ligne)
      const phoneMatch = extractPhoneFromQR(qrCode);
      if (phoneMatch) {
        const subByPhone = await findActiveSubscriptionByPhone(phoneMatch);
        if (subByPhone) {
          return validateSubscriptionStatus(subByPhone, vehicleId, vehicleLineId);
        }
      }

      console.log(`[SAMA-PASS-SCAN] ❌ Abonnement introuvable`);
      return {
        isValid: false,
        status: 'not_found',
        message: 'PASS INVALIDE - Code non reconnu',
        color: 'red'
      };
    }

    // 2. Valider le statut de l'abonnement avec tous les contrôles de sécurité
    return validateSubscriptionStatus(subscription, vehicleId, vehicleLineId);

  } catch (error: any) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur validation:`, error);
    return {
      isValid: false,
      status: 'invalid',
      message: 'Erreur de validation',
      color: 'red'
    };
  }
}

/**
 * Cherche un abonnement par QR Code
 */
async function findSubscriptionByQR(qrCode: string): Promise<SamaPassSubscription | null> {
  try {
    const abonnementsRef = ref(db, 'abonnements_express');
    const snapshot = await get(abonnementsRef);

    if (!snapshot.exists()) {
      console.log(`[SAMA-PASS-SCAN] ⚠️ Collection abonnements_express vide`);
      return null;
    }

    const allSubscriptions = snapshot.val();

    // Recherche dans tous les abonnements
    for (const [id, sub] of Object.entries(allSubscriptions)) {
      const subscription = sub as SamaPassSubscription;
      if (subscription.qr_code === qrCode) {
        console.log(`[SAMA-PASS-SCAN] ✅ Abonnement trouvé: ${subscription.full_name}`);
        return { ...subscription, id };
      }
    }

    console.log(`[SAMA-PASS-SCAN] ⚠️ QR Code non trouvé dans abonnements_express`);
    return null;

  } catch (error) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur recherche QR:`, error);
    return null;
  }
}

/**
 * Cherche un abonnement actif par numéro de téléphone
 */
async function findActiveSubscriptionByPhone(phone: string): Promise<SamaPassSubscription | null> {
  try {
    const abonnementsRef = ref(db, 'abonnements_express');
    const snapshot = await get(abonnementsRef);

    if (!snapshot.exists()) {
      return null;
    }

    const allSubscriptions = snapshot.val();
    const now = new Date();

    // Recherche d'un abonnement actif pour ce téléphone
    for (const [id, sub] of Object.entries(allSubscriptions)) {
      const subscription = sub as SamaPassSubscription;

      if (subscription.subscriber_phone === phone &&
          subscription.status === 'active' &&
          new Date(subscription.end_date) > now) {
        console.log(`[SAMA-PASS-SCAN] ✅ Abonnement actif trouvé par téléphone: ${phone}`);
        return { ...subscription, id };
      }
    }

    return null;

  } catch (error) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur recherche par téléphone:`, error);
    return null;
  }
}

/**
 * Valide le statut d'un abonnement avec contrôles de sécurité renforcés
 *
 * Contrôles effectués (Gënaa Wóor) :
 * 1. Statut de l'abonnement (actif/suspendu)
 * 2. Période de validité (dates début/fin)
 * 3. Vérification de la ligne (sectorisation)
 * 4. Limitation quotidienne (2 trajets/jour max)
 * 5. Anti-passback (30 min minimum entre scans)
 */
async function validateSubscriptionStatus(
  subscription: SamaPassSubscription,
  vehicleId: string,
  vehicleLineId?: string
): Promise<ScanValidationResult> {

  const now = new Date();
  const endDate = new Date(subscription.end_date);
  const startDate = new Date(subscription.start_date);

  // ========================================
  // CONTRÔLE 1 : Statut de l'abonnement
  // ========================================
  if (subscription.status !== 'active') {
    console.log(`[SAMA-PASS-SCAN] ⚠️ Abonnement suspendu ou inactif`);
    return {
      isValid: false,
      status: 'invalid',
      message: `PASS ${subscription.status.toUpperCase()}`,
      subscription,
      color: 'red'
    };
  }

  // ========================================
  // CONTRÔLE 2 : Période de validité
  // ========================================
  if (now < startDate) {
    console.log(`[SAMA-PASS-SCAN] ⚠️ Abonnement pas encore actif`);
    return {
      isValid: false,
      status: 'invalid',
      message: 'PASS PAS ENCORE ACTIF',
      subscription,
      color: 'orange'
    };
  }

  if (now > endDate) {
    const daysSinceExpiry = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`[SAMA-PASS-SCAN] ⚠️ Abonnement expiré depuis ${daysSinceExpiry} jours`);

    // Tolérance de 2 jours pour renouvellement
    if (daysSinceExpiry <= 2) {
      return {
        isValid: false,
        status: 'expired',
        message: `PASS EXPIRÉ - ${daysSinceExpiry}j`,
        subscription,
        color: 'orange'
      };
    } else {
      return {
        isValid: false,
        status: 'expired',
        message: 'PASS EXPIRÉ',
        subscription,
        color: 'red'
      };
    }
  }

  // ========================================
  // CONTRÔLE 3 : Vérification de la ligne (Sectorisation)
  // ========================================
  if (vehicleLineId && subscription.route_id) {
    if (subscription.route_id !== vehicleLineId) {
      console.log(`[SAMA-PASS-SCAN] ❌ ERREUR LIGNE: Pass pour ${subscription.route_id}, véhicule sur ${vehicleLineId}`);
      return {
        isValid: false,
        status: 'wrong_line',
        message: `ERREUR LIGNE`,
        subscription,
        color: 'red',
        expectedLine: subscription.route_name
      };
    }
    console.log(`[SAMA-PASS-SCAN] ✅ Ligne correcte: ${subscription.route_name}`);
  }

  // ========================================
  // CONTRÔLE 4 : Limitation quotidienne (2 trajets/jour max)
  // ========================================
  const todayScans = await getDailyScansCount(subscription.id);
  console.log(`[SAMA-PASS-SCAN] 📊 Scans aujourd'hui: ${todayScans}/2`);

  if (todayScans >= 2) {
    console.log(`[SAMA-PASS-SCAN] ⚠️ QUOTA ATTEINT: 2/2 trajets`);
    return {
      isValid: false,
      status: 'quota_exceeded',
      message: 'LIMITE ATTEINTE',
      subscription,
      color: 'orange',
      scansToday: todayScans
    };
  }

  // ========================================
  // CONTRÔLE 5 : Anti-Passback (30 min minimum)
  // ========================================
  const lastScan = await getLastScanTime(subscription.id);
  if (lastScan) {
    const lastScanTime = new Date(lastScan);
    const minutesSinceLastScan = Math.floor((now.getTime() - lastScanTime.getTime()) / (1000 * 60));

    console.log(`[SAMA-PASS-SCAN] ⏱️ Dernier scan: il y a ${minutesSinceLastScan} min`);

    if (minutesSinceLastScan < 30) {
      const remainingMinutes = 30 - minutesSinceLastScan;
      console.log(`[SAMA-PASS-SCAN] ⚠️ SCAN TROP RAPPROCHÉ: ${remainingMinutes} min restantes`);
      return {
        isValid: false,
        status: 'too_soon',
        message: `SCAN TROP RAPPROCHÉ`,
        subscription,
        color: 'orange',
        lastScanTime: lastScan
      };
    }
  }

  // ========================================
  // ✅ TOUS LES CONTRÔLES PASSÉS - VALIDATION
  // ========================================
  console.log(`[SAMA-PASS-SCAN] ✅ Validation réussie: ${subscription.full_name}`);

  // Enregistrer le scan
  await recordTransportScan(vehicleId, subscription, 'valid');
  await recordDailyScan(subscription.id);

  return {
    isValid: true,
    status: 'valid',
    message: 'PASS VALIDE',
    subscription,
    color: 'green',
    scansToday: todayScans + 1
  };
}

/**
 * Enregistre un scan dans transport/scans
 */
export async function recordTransportScan(
  vehicleId: string,
  subscription: SamaPassSubscription,
  scanStatus: 'valid' | 'expired' | 'invalid'
): Promise<void> {

  try {
    const scansRef = ref(db, `transport/scans/${vehicleId}`);
    const newScanRef = push(scansRef);

    const scanRecord: TransportScanRecord = {
      vehicleId,
      timestamp: new Date().toISOString(),
      passengerPhone: subscription.subscriber_phone,
      passengerName: subscription.full_name,
      subscriptionType: subscription.subscription_type,
      subscriptionTier: subscription.subscription_tier,
      routeName: subscription.route_name,
      scanStatus
    };

    await set(newScanRef, scanRecord);

    console.log(`[SAMA-PASS-SCAN] ✅ Scan enregistré pour véhicule ${vehicleId}`);

  } catch (error) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur enregistrement scan:`, error);
    throw error;
  }
}

/**
 * Récupère le nombre de scans effectués aujourd'hui pour un abonnement
 */
async function getDailyScansCount(subscriptionId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dailyScansRef = ref(db, `scans_journaliers/${today}/${subscriptionId}`);
    const snapshot = await get(dailyScansRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const scans = snapshot.val();
    return scans.count || 0;

  } catch (error) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur lecture scans quotidiens:`, error);
    return 0;
  }
}

/**
 * Récupère l'heure du dernier scan pour un abonnement
 */
async function getLastScanTime(subscriptionId: string): Promise<string | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyScansRef = ref(db, `scans_journaliers/${today}/${subscriptionId}`);
    const snapshot = await get(dailyScansRef);

    if (!snapshot.exists()) {
      return null;
    }

    const scans = snapshot.val();
    return scans.lastScanTime || null;

  } catch (error) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur lecture dernier scan:`, error);
    return null;
  }
}

/**
 * Enregistre un scan dans le compteur quotidien
 */
async function recordDailyScan(subscriptionId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyScansRef = ref(db, `scans_journaliers/${today}/${subscriptionId}`);

    const snapshot = await get(dailyScansRef);
    const currentCount = snapshot.exists() ? (snapshot.val().count || 0) : 0;

    await set(dailyScansRef, {
      count: currentCount + 1,
      lastScanTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`[SAMA-PASS-SCAN] ✅ Compteur quotidien mis à jour: ${currentCount + 1}/2`);

  } catch (error) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur mise à jour compteur:`, error);
    throw error;
  }
}

/**
 * Extrait le numéro de téléphone d'un QR Code
 * Format attendu: SAMAPASS-{phone}-{id} ou simplement le numéro
 */
function extractPhoneFromQR(qrCode: string): string | null {
  // Format SAMAPASS-221771234567-xxx
  const samaPassMatch = qrCode.match(/SAMAPASS-(\d+)-/);
  if (samaPassMatch) {
    return samaPassMatch[1];
  }

  // Format téléphone direct (77/78/76/70 + 7 chiffres)
  const phoneMatch = qrCode.match(/^(77|78|76|70)\d{7}$/);
  if (phoneMatch) {
    return `221${qrCode}`;
  }

  // Format international (221...)
  const intlMatch = qrCode.match(/^221(77|78|76|70)\d{7}$/);
  if (intlMatch) {
    return qrCode;
  }

  return null;
}

/**
 * Obtient les statistiques de scan pour un véhicule
 */
export async function getVehicleScanStats(vehicleId: string, date?: string): Promise<{
  totalScans: number;
  validScans: number;
  expiredScans: number;
  invalidScans: number;
}> {

  try {
    const scansRef = ref(db, `transport/scans/${vehicleId}`);
    const snapshot = await get(scansRef);

    if (!snapshot.exists()) {
      return { totalScans: 0, validScans: 0, expiredScans: 0, invalidScans: 0 };
    }

    const allScans = snapshot.val();
    const targetDate = date || new Date().toISOString().split('T')[0];

    let totalScans = 0;
    let validScans = 0;
    let expiredScans = 0;
    let invalidScans = 0;

    Object.values(allScans).forEach((scan: any) => {
      const scanDate = scan.timestamp.split('T')[0];

      if (scanDate === targetDate) {
        totalScans++;

        if (scan.scanStatus === 'valid') validScans++;
        else if (scan.scanStatus === 'expired') expiredScans++;
        else if (scan.scanStatus === 'invalid') invalidScans++;
      }
    });

    return { totalScans, validScans, expiredScans, invalidScans };

  } catch (error) {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur stats:`, error);
    return { totalScans: 0, validScans: 0, expiredScans: 0, invalidScans: 0 };
  }
}
