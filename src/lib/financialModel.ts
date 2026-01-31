/**
 * Modèle Financier VIP & Fast Track (H.3)
 *
 * Règles :
 * 1. Seuil VIP : 2000 billets
 * 2. Mode Accord Exclusivité :
 *    - ON : Commission 5% ajoutée au prix (payée par acheteur)
 *           Organisateur reçoit net (moins 2% frais techniques de retrait)
 *    - OFF : 5% commission partagée (2.5% acheteur / 2.5% vendeur)
 * 3. Capping : Frais de service max 2500 FCFA par billet
 * 4. Libération VIP Fast Track :
 *    - Si jauge >= 2000 ET Accord Exclusivité = ON
 *    - Libération 70% du prix HT immédiatement
 *    - 25% en séquestre de sécurité
 *    - 5% commission platform
 */

export const VIP_THRESHOLD = 2000; // Seuil VIP : 2000 billets
export const PLATFORM_COMMISSION_RATE = 0.05; // 5%
export const VIP_IMMEDIATE_RELEASE_RATE = 0.70; // 70%
export const VIP_ESCROW_RATE = 0.25; // 25%
export const TECHNICAL_WITHDRAWAL_FEE_RATE = 0.02; // 2%
export const SERVICE_FEE_CAP = 2500; // 2500 FCFA max

/**
 * Calcule les frais de service selon le mode Accord Exclusivité
 * @param ticketPrice Prix HT du billet
 * @param exclusivityMode Mode Accord Exclusivité (true = ON, false = OFF)
 * @returns Objet avec les détails des frais
 */
export function calculateServiceFees(
  ticketPrice: number,
  exclusivityMode: boolean
): {
  serviceFee: number;
  buyerFee: number;
  sellerFee: number;
  totalPrice: number; // Prix TTC payé par acheteur
  netToOrganizer: number; // Net reçu par organisateur (avant retrait)
} {
  if (exclusivityMode) {
    // Mode Exclusivité ON : Commission 5% ajoutée au prix (payée par acheteur)
    const serviceFee = Math.min(ticketPrice * PLATFORM_COMMISSION_RATE, SERVICE_FEE_CAP);
    const totalPrice = ticketPrice + serviceFee;

    return {
      serviceFee,
      buyerFee: serviceFee,
      sellerFee: 0,
      totalPrice,
      netToOrganizer: ticketPrice // Organisateur reçoit le prix HT
    };
  } else {
    // Mode Exclusivité OFF : 5% partagée (2.5% acheteur / 2.5% vendeur)
    const totalServiceFee = Math.min(ticketPrice * PLATFORM_COMMISSION_RATE, SERVICE_FEE_CAP);
    const buyerFee = totalServiceFee / 2;
    const sellerFee = totalServiceFee / 2;
    const totalPrice = ticketPrice + buyerFee;
    const netToOrganizer = ticketPrice - sellerFee;

    return {
      serviceFee: totalServiceFee,
      buyerFee,
      sellerFee,
      totalPrice,
      netToOrganizer
    };
  }
}

/**
 * Vérifie si un événement est éligible au Fast Track VIP
 * @param totalCapacity Jauge totale de l'événement
 * @param exclusivityAgreement Accord Exclusivité activé
 * @returns true si éligible au Fast Track
 */
export function isEligibleForVIPFastTrack(
  totalCapacity: number,
  exclusivityAgreement: boolean
): boolean {
  return totalCapacity >= VIP_THRESHOLD && exclusivityAgreement === true;
}

/**
 * Calcule la répartition des fonds pour un événement VIP Fast Track
 * @param totalRevenue Revenu total de l'événement
 * @param isVIPFastTrack Événement éligible au Fast Track
 * @returns Répartition des fonds
 */
export function calculateFundsDistribution(
  totalRevenue: number,
  isVIPFastTrack: boolean
): {
  immediateRelease: number; // Fonds libérés immédiatement (70% pour VIP)
  escrow: number; // Fonds en séquestre (25% pour VIP, 95% pour non-VIP)
  platformCommission: number; // Commission platform (5%)
} {
  const platformCommission = totalRevenue * PLATFORM_COMMISSION_RATE;

  if (isVIPFastTrack) {
    // VIP Fast Track : 70% libération immédiate, 25% séquestre, 5% commission
    const immediateRelease = totalRevenue * VIP_IMMEDIATE_RELEASE_RATE;
    const escrow = totalRevenue * VIP_ESCROW_RATE;

    return {
      immediateRelease,
      escrow,
      platformCommission
    };
  } else {
    // Mode Standard : 95% séquestre (libéré après scan), 5% commission
    const escrow = totalRevenue * 0.95;

    return {
      immediateRelease: 0,
      escrow,
      platformCommission
    };
  }
}

/**
 * Calcule le montant net après frais de retrait (2%)
 * @param amount Montant brut
 * @returns Montant net après frais techniques
 */
export function calculateNetAfterWithdrawal(amount: number): number {
  const withdrawalFee = amount * TECHNICAL_WITHDRAWAL_FEE_RATE;
  return amount - withdrawalFee;
}

/**
 * Formatte un montant en FCFA
 * @param amount Montant à formater
 * @returns Montant formaté avec séparateur de milliers
 */
export function formatCurrency(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

/**
 * Génère un résumé financier pour un événement
 * @param event Événement
 * @returns Résumé financier détaillé
 */
export function generateEventFinancialSummary(event: {
  totalCapacity?: number;
  exclusivityAgreement?: boolean;
  totalTicketsSold?: number;
  totalRevenue?: number;
}): {
  isVIP: boolean;
  vipStatus: string;
  totalRevenue: number;
  immediateRelease: number;
  escrow: number;
  platformCommission: number;
  netAfterWithdrawal: number;
} {
  const totalCapacity = event.totalCapacity || 0;
  const exclusivityAgreement = event.exclusivityAgreement || false;
  const totalRevenue = event.totalRevenue || 0;

  const isVIP = isEligibleForVIPFastTrack(totalCapacity, exclusivityAgreement);
  const distribution = calculateFundsDistribution(totalRevenue, isVIP);
  const netAfterWithdrawal = calculateNetAfterWithdrawal(distribution.immediateRelease + distribution.escrow);

  let vipStatus = 'Standard';
  if (isVIP) {
    vipStatus = 'VIP Fast Track ⚡';
  } else if (totalCapacity >= VIP_THRESHOLD && !exclusivityAgreement) {
    vipStatus = `Éligible VIP (Activer Accord Exclusivité)`;
  }

  return {
    isVIP,
    vipStatus,
    totalRevenue,
    immediateRelease: distribution.immediateRelease,
    escrow: distribution.escrow,
    platformCommission: distribution.platformCommission,
    netAfterWithdrawal
  };
}
