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
  status: 'valid' | 'expired' | 'invalid' | 'not_found';
  message: string;
  subscription?: SamaPassSubscription;
  color: 'green' | 'orange' | 'red';
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
 * Valide un QR Code SAMA PASS
 */
export async function validateSamaPass(
  qrCode: string,
  vehicleId: string
): Promise<ScanValidationResult> {

  console.log(`[SAMA-PASS-SCAN] 📱 Validation QR: ${qrCode.substring(0, 20)}...`);

  try {
    // 1. Chercher l'abonnement dans abonnements_express
    const subscription = await findSubscriptionByQR(qrCode);

    if (!subscription) {
      // Tentative de validation par numéro de téléphone (mode hors-ligne)
      const phoneMatch = extractPhoneFromQR(qrCode);
      if (phoneMatch) {
        const subByPhone = await findActiveSubscriptionByPhone(phoneMatch);
        if (subByPhone) {
          return validateSubscriptionStatus(subByPhone, vehicleId);
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

    // 2. Valider le statut de l'abonnement
    return validateSubscriptionStatus(subscription, vehicleId);

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
 * Valide le statut d'un abonnement trouvé
 */
function validateSubscriptionStatus(
  subscription: SamaPassSubscription,
  vehicleId: string
): ScanValidationResult {

  const now = new Date();
  const endDate = new Date(subscription.end_date);
  const startDate = new Date(subscription.start_date);

  // Vérifier si l'abonnement est actif
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

  // Vérifier si l'abonnement est dans la période de validité
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

  // Vérifier si l'abonnement est expiré
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

  // Abonnement valide
  console.log(`[SAMA-PASS-SCAN] ✅ Validation réussie: ${subscription.full_name}`);

  // Enregistrer le scan
  recordTransportScan(vehicleId, subscription, 'valid').catch(err => {
    console.error(`[SAMA-PASS-SCAN] ❌ Erreur enregistrement scan:`, err);
  });

  return {
    isValid: true,
    status: 'valid',
    message: 'PASS VALIDE',
    subscription,
    color: 'green'
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
