import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';

/**
 * Configure le rôle ops_transport pour un utilisateur dans Firebase Realtime Database
 *
 * Cette fonction doit être appelée pour donner les permissions nécessaires
 * à un utilisateur pour gérer la flotte de véhicules.
 *
 * @param userId - L'UID Firebase de l'utilisateur
 * @param email - L'email de l'utilisateur (optionnel, pour référence)
 * @param role - Le rôle à assigner (par défaut: 'ops_transport')
 * @returns Promise<boolean> - true si réussi, false sinon
 */
export async function configureOpsRole(
  userId: string,
  email?: string,
  role: 'ops_transport' | 'super_admin' = 'ops_transport'
): Promise<boolean> {
  try {
    if (!db) {
      console.error('❌ Firebase DB non initialisé');
      return false;
    }

    console.log('🔧 Configuration du rôle pour:', userId);

    const userRef = ref(db, `users/${userId}`);

    // Vérifier si l'utilisateur existe déjà
    const snapshot = await get(userRef);
    const existingData = snapshot.exists() ? snapshot.val() : {};

    // Fusionner avec les données existantes
    const userData = {
      ...existingData,
      role: role,
      email: email || existingData.email || 'unknown',
      updated_at: new Date().toISOString(),
      permissions: {
        fleet_management: true,
        vehicle_enrollment: true,
        scan_events_read: true,
        transport_lines_management: true
      }
    };

    await set(userRef, userData);

    console.log('✅ Rôle configuré avec succès:', {
      userId,
      role,
      email: userData.email
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du rôle:', error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur a le rôle ops_transport
 *
 * @param userId - L'UID Firebase de l'utilisateur
 * @returns Promise<{ hasRole: boolean; role: string | null }>
 */
export async function checkOpsRole(userId: string): Promise<{ hasRole: boolean; role: string | null }> {
  try {
    if (!db) {
      console.error('❌ Firebase DB non initialisé');
      return { hasRole: false, role: null };
    }

    const userRef = ref(db, `users/${userId}/role`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      console.warn('⚠️ Aucun rôle trouvé pour:', userId);
      return { hasRole: false, role: null };
    }

    const role = snapshot.val();
    const hasRole = role === 'ops_transport' || role === 'super_admin';

    console.log('🔍 Vérification du rôle:', {
      userId,
      role,
      hasRole
    });

    return { hasRole, role };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du rôle:', error);
    return { hasRole: false, role: null };
  }
}

/**
 * Script de configuration rapide - À exécuter dans la console navigateur
 *
 * Exemple d'utilisation:
 *
 * import { configureOpsRole } from './utils/configureOpsRole';
 * import { auth } from './firebase';
 *
 * // Configurer le rôle pour l'utilisateur actuellement connecté
 * const currentUser = auth.currentUser;
 * if (currentUser) {
 *   await configureOpsRole(currentUser.uid, currentUser.email || undefined);
 *   console.log('✅ Rôle configuré! Rechargez la page.');
 * }
 */
export async function configureCurrentUserAsOps(): Promise<void> {
  try {
    // Cette fonction est conçue pour être appelée depuis la console navigateur
    const currentUser = (window as any).auth?.currentUser;

    if (!currentUser) {
      console.error('❌ Aucun utilisateur connecté');
      console.log('💡 Connectez-vous d\'abord, puis réessayez');
      return;
    }

    console.log('🔧 Configuration du rôle ops_transport pour:', currentUser.email);

    const success = await configureOpsRole(
      currentUser.uid,
      currentUser.email || undefined,
      'ops_transport'
    );

    if (success) {
      console.log('');
      console.log('✅ SUCCÈS! Rôle ops_transport configuré');
      console.log('');
      console.log('📋 Prochaines étapes:');
      console.log('   1. Rechargez la page (F5)');
      console.log('   2. Essayez d\'enrôler un véhicule');
      console.log('   3. Si l\'erreur persiste, vérifiez les règles Firebase');
      console.log('');
    } else {
      console.error('❌ Échec de la configuration du rôle');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}
