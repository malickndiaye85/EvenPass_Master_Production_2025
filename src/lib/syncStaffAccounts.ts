import { ref, get, set } from 'firebase/database';
import { database } from '../firebase';

export async function syncStaffAccountByEmail(email: string): Promise<{ success: boolean; uid?: string; role?: string; error?: string }> {
  if (!database) {
    return { success: false, error: 'Firebase database not configured' };
  }

  try {
    console.log('[STAFF SYNC] Recherche du compte staff pour:', email);

    const staffRef = ref(database, 'staff');
    const staffSnapshot = await get(staffRef);

    if (!staffSnapshot.exists()) {
      return { success: false, error: 'Aucun staff trouvé dans la base' };
    }

    const allStaff = staffSnapshot.val();
    const staffEntry = Object.entries(allStaff).find(
      ([_, staff]: [string, any]) => staff.email?.toLowerCase() === email.toLowerCase()
    );

    if (!staffEntry) {
      return { success: false, error: 'Email non trouvé dans les comptes staff' };
    }

    const [staffId, staffData]: [string, any] = staffEntry;
    console.log('[STAFF SYNC] Staff trouvé:', staffId, staffData);

    return {
      success: true,
      uid: staffId,
      role: staffData.role,
    };
  } catch (error: any) {
    console.error('[STAFF SYNC] Erreur:', error);
    return { success: false, error: error.message };
  }
}

export async function syncAllStaffToUsers(): Promise<{ synced: number; errors: string[] }> {
  if (!database) {
    return { synced: 0, errors: ['Firebase database not configured'] };
  }

  let synced = 0;
  const errors: string[] = [];

  try {
    console.log('[STAFF SYNC] Début de la synchronisation globale...');

    const staffRef = ref(database, 'staff');
    const staffSnapshot = await get(staffRef);

    if (!staffSnapshot.exists()) {
      return { synced: 0, errors: ['Aucun staff à synchroniser'] };
    }

    const allStaff = staffSnapshot.val();

    for (const [staffId, staffData] of Object.entries(allStaff) as [string, any][]) {
      try {
        console.log(`[STAFF SYNC] Synchronisation de ${staffData.email}...`);

        const userRef = ref(database, `users/${staffId}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists() || !userSnapshot.val()?.role) {
          const syncedData = {
            email: staffData.email,
            role: staffData.role,
            silo: staffData.silo_id || staffData.silo?.toLowerCase(),
            silo_id: staffData.silo_id || staffData.silo?.toLowerCase(),
            created_at: staffData.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            auto_synced: true
          };

          await set(userRef, syncedData);
          console.log(`[STAFF SYNC] ✅ ${staffData.email} synchronisé`);
          synced++;
        } else {
          console.log(`[STAFF SYNC] ⏭️ ${staffData.email} déjà synchronisé`);
        }
      } catch (error: any) {
        const errorMsg = `Erreur pour ${staffData.email}: ${error.message}`;
        console.error(`[STAFF SYNC] ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[STAFF SYNC] ✅ Synchronisation terminée: ${synced} comptes`);
    return { synced, errors };
  } catch (error: any) {
    console.error('[STAFF SYNC] Erreur globale:', error);
    return { synced, errors: [...errors, error.message] };
  }
}

export async function syncStaffAccountOnLogin(firebaseUid: string, firebaseEmail: string): Promise<{ success: boolean; role?: string; error?: string }> {
  if (!database) {
    return { success: false, error: 'Firebase database not configured' };
  }

  try {
    console.log('[STAFF SYNC LOGIN] Vérification pour UID:', firebaseUid, 'Email:', firebaseEmail);

    const userRef = ref(database, `users/${firebaseUid}`);
    const userSnapshot = await get(userRef);

    let userData = userSnapshot.exists() ? userSnapshot.val() : null;
    let userRole = userData?.role || '';

    if (!userData || !userRole) {
      console.log('[STAFF SYNC LOGIN] Recherche dans staff...');

      const staffRef = ref(database, 'staff');
      const staffSnapshot = await get(staffRef);

      if (staffSnapshot.exists()) {
        const allStaff = staffSnapshot.val();
        const staffEntry = Object.entries(allStaff).find(
          ([_, staff]: [string, any]) => staff.email?.toLowerCase() === firebaseEmail.toLowerCase()
        );

        if (staffEntry) {
          const [staffId, staffData]: [string, any] = staffEntry;
          console.log('[STAFF SYNC LOGIN] ✅ Trouvé dans staff:', staffId);

          const syncedData = {
            email: firebaseEmail,
            role: staffData.role,
            silo: staffData.silo_id || staffData.silo?.toLowerCase(),
            silo_id: staffData.silo_id || staffData.silo?.toLowerCase(),
            created_at: staffData.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced_from_staff: true
          };

          await set(userRef, syncedData);
          console.log('[STAFF SYNC LOGIN] ✅ Synchronisé dans users/{uid}');

          const adminRef = ref(database, `admins/${firebaseUid}`);
          await set(adminRef, {
            ...syncedData,
            is_active: true,
            created_by: staffData.created_by || 'system'
          });
          console.log('[STAFF SYNC LOGIN] ✅ Synchronisé dans admins/{uid}');

          return { success: true, role: staffData.role };
        }
      }

      console.log('[STAFF SYNC LOGIN] Recherche dans admins...');
      const adminsRef = ref(database, 'admins');
      const adminsSnapshot = await get(adminsRef);

      if (adminsSnapshot.exists()) {
        const allAdmins = adminsSnapshot.val();
        const adminEntry = Object.entries(allAdmins).find(
          ([_, admin]: [string, any]) => admin.email?.toLowerCase() === firebaseEmail.toLowerCase()
        );

        if (adminEntry) {
          const [adminId, adminData]: [string, any] = adminEntry;
          console.log('[STAFF SYNC LOGIN] ✅ Trouvé dans admins:', adminId);

          const syncedData = {
            email: firebaseEmail,
            role: adminData.role,
            silo: adminData.silo_id || adminData.silo,
            silo_id: adminData.silo_id || adminData.silo,
            created_at: adminData.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced_from_admins: true,
            is_active: true
          };

          await set(userRef, syncedData);
          console.log('[STAFF SYNC LOGIN] ✅ Synchronisé dans users/{uid} depuis admins');

          return { success: true, role: adminData.role };
        }
      }

      return { success: false, error: 'Compte non trouvé dans staff ou admins' };
    }

    console.log('[STAFF SYNC LOGIN] ✅ Déjà synchronisé, rôle:', userRole);
    return { success: true, role: userRole };
  } catch (error: any) {
    console.error('[STAFF SYNC LOGIN] Erreur:', error);
    return { success: false, error: error.message };
  }
}
