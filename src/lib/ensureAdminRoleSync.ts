/**
 * Script de Synchronisation Automatique AdminRoles
 *
 * Assure que chaque utilisateur avec un rôle dans /admins/
 * est automatiquement répliqué dans /adminRoles/ pour compatibilité
 * avec les anciennes règles Firebase.
 *
 * Date: 2026-03-05
 */

import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';

export interface AdminRoleSyncResult {
  success: boolean;
  action: 'created' | 'already_exists' | 'error';
  message: string;
  data?: any;
}

/**
 * Synchronise le profil admin d'un utilisateur vers /adminRoles/
 * pour satisfaire les règles de sécurité Firebase
 */
export async function ensureAdminRoleExists(
  uid: string,
  email: string,
  role: string
): Promise<AdminRoleSyncResult> {

  console.log(`🔄 [ADMIN-ROLE-SYNC] Vérification pour UID: ${uid}, Email: ${email}, Role: ${role}`);

  try {
    // 1. Vérifier si l'entrée existe déjà dans /adminRoles/
    const adminRoleRef = ref(db, `adminRoles/${uid}`);
    const snapshot = await get(adminRoleRef);

    if (snapshot.exists()) {
      console.log(`✅ [ADMIN-ROLE-SYNC] Entrée déjà présente dans adminRoles pour ${email}`);
      return {
        success: true,
        action: 'already_exists',
        message: 'Profil admin déjà synchronisé',
        data: snapshot.val()
      };
    }

    // 2. Créer l'entrée dans /adminRoles/
    const adminRoleData = {
      role: role,
      email: email,
      syncedAt: new Date().toISOString(),
      syncedFrom: 'admins_table',
      autoCreated: true
    };

    await set(adminRoleRef, adminRoleData);

    console.log(`✅ [ADMIN-ROLE-SYNC] Entrée créée dans adminRoles pour ${email}`);
    console.log(`✅ [ADMIN-ROLE-SYNC] Données:`, adminRoleData);

    return {
      success: true,
      action: 'created',
      message: 'Profil admin synchronisé avec succès',
      data: adminRoleData
    };

  } catch (error: any) {
    console.error(`❌ [ADMIN-ROLE-SYNC] Erreur pour ${email}:`, error);
    return {
      success: false,
      action: 'error',
      message: error.message || 'Erreur inconnue lors de la synchronisation'
    };
  }
}

/**
 * Vérifie et synchronise automatiquement l'utilisateur connecté
 * Appelé au chargement du dashboard ops_transport
 */
export async function autoSyncCurrentUser(
  uid: string,
  email: string,
  role: string
): Promise<void> {

  // Uniquement pour les rôles admin (pas pour les chauffeurs/passagers)
  if (!['ops_transport', 'ops_events', 'super_admin', 'finance'].includes(role)) {
    console.log(`⏭️ [ADMIN-ROLE-SYNC] Skip sync pour rôle: ${role}`);
    return;
  }

  console.log(`🚀 [ADMIN-ROLE-SYNC] Auto-sync démarré pour ${email}`);

  const result = await ensureAdminRoleExists(uid, email, role);

  if (result.success && result.action === 'created') {
    console.log(`🎉 [ADMIN-ROLE-SYNC] ✅ Profil créé automatiquement dans adminRoles`);
  } else if (result.success && result.action === 'already_exists') {
    console.log(`✓ [ADMIN-ROLE-SYNC] Profil déjà présent, aucune action requise`);
  } else {
    console.error(`❌ [ADMIN-ROLE-SYNC] Échec de la synchronisation:`, result.message);
  }
}
