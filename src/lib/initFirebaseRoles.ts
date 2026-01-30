import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';

const ADMIN_UID = 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
const ADMIN_EMAIL = 'sn.malickndiaye@gmail.com';

interface InitRoleResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export async function initSuperAdminRole(): Promise<InitRoleResult> {
  if (!db) {
    return {
      success: false,
      message: 'Firebase database not configured'
    };
  }

  const errors: string[] = [];

  try {
    console.log('[INIT ROLES] 🔧 Initializing Super Admin role for UID:', ADMIN_UID);

    const userRef = ref(db, `users/${ADMIN_UID}`);
    const userSnapshot = await get(userRef);
    const existingUserData = userSnapshot.val();

    const userData = {
      email: ADMIN_EMAIL,
      full_name: existingUserData?.full_name || 'Malick NDIAYE',
      phone: existingUserData?.phone || '+221 77 123 45 67',
      role: 'super_admin',
      is_active: true,
      created_at: existingUserData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await set(userRef, userData);
    console.log('[INIT ROLES] ✅ User data set:', ADMIN_UID);

    const adminRef = ref(db, `admins/${ADMIN_UID}`);
    const adminSnapshot = await get(adminRef);
    const existingAdminData = adminSnapshot.val();

    const adminData = {
      user_id: ADMIN_UID,
      role: 'super_admin',
      permissions: ['all'],
      is_active: true,
      can_manage_events: true,
      can_manage_organizers: true,
      can_manage_finances: true,
      can_manage_users: true,
      can_manage_transport: true,
      created_at: existingAdminData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await set(adminRef, adminData);
    console.log('[INIT ROLES] ✅ Admin data set:', ADMIN_UID);

    return {
      success: true,
      message: `Super Admin role initialized successfully for ${ADMIN_EMAIL}`
    };

  } catch (error: any) {
    console.error('[INIT ROLES] ❌ Error initializing Super Admin:', error);
    errors.push(error.message);
    return {
      success: false,
      message: 'Failed to initialize Super Admin role',
      errors
    };
  }
}

export async function initOrganizerRole(
  uid: string,
  email: string,
  organizationName: string
): Promise<InitRoleResult> {
  if (!db) {
    return {
      success: false,
      message: 'Firebase database not configured'
    };
  }

  const errors: string[] = [];

  try {
    console.log('[INIT ROLES] 🔧 Initializing Organizer role for UID:', uid);

    const userRef = ref(db, `users/${uid}`);
    const userSnapshot = await get(userRef);
    const existingUserData = userSnapshot.val();

    const userData = {
      email,
      full_name: existingUserData?.full_name || organizationName,
      phone: existingUserData?.phone || null,
      role: 'organizer',
      is_active: true,
      created_at: existingUserData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await set(userRef, userData);
    console.log('[INIT ROLES] ✅ User data set:', uid);

    const organizerRef = ref(db, `organizers/${uid}`);
    const organizerSnapshot = await get(organizerRef);
    const existingOrganizerData = organizerSnapshot.val();

    const organizerData = {
      user_id: uid,
      organization_name: organizationName,
      organization_type: existingOrganizerData?.organization_type || 'company',
      contact_email: email,
      contact_phone: existingUserData?.phone || existingOrganizerData?.contact_phone || null,
      verification_status: 'verified',
      is_active: true,
      created_at: existingOrganizerData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await set(organizerRef, organizerData);
    console.log('[INIT ROLES] ✅ Organizer data set:', uid);

    return {
      success: true,
      message: `Organizer role initialized successfully for ${email}`
    };

  } catch (error: any) {
    console.error('[INIT ROLES] ❌ Error initializing Organizer:', error);
    errors.push(error.message);
    return {
      success: false,
      message: `Failed to initialize Organizer role for ${email}`,
      errors
    };
  }
}

export async function verifyOrganizersByEvents(): Promise<InitRoleResult> {
  if (!db) {
    return {
      success: false,
      message: 'Firebase database not configured'
    };
  }

  try {
    console.log('[INIT ROLES] 🔍 Verifying organizers from events...');

    const eventsRef = ref(db, 'events');
    const eventsSnapshot = await get(eventsRef);

    if (!eventsSnapshot.exists()) {
      return {
        success: true,
        message: 'No events found, nothing to verify'
      };
    }

    const events = eventsSnapshot.val();
    const organizerIds = new Set<string>();

    Object.values(events).forEach((event: any) => {
      if (event.organizer_id) {
        organizerIds.add(event.organizer_id);
      }
    });

    console.log('[INIT ROLES] 📋 Found organizer IDs from events:', Array.from(organizerIds));

    const results: string[] = [];
    for (const organizerId of organizerIds) {
      const organizerRef = ref(db, `organizers/${organizerId}`);
      const organizerSnapshot = await get(organizerRef);

      if (!organizerSnapshot.exists()) {
        results.push(`⚠️ Organizer ${organizerId} has events but no organizer record`);
        continue;
      }

      const organizerData = organizerSnapshot.val();

      if (!organizerData.is_active || organizerData.verification_status !== 'verified') {
        console.log(`[INIT ROLES] 🔧 Fixing organizer ${organizerId}...`);

        await set(organizerRef, {
          ...organizerData,
          is_active: true,
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        });

        results.push(`✅ Fixed organizer ${organizerId} (${organizerData.organization_name || organizerData.contact_email})`);
      } else {
        results.push(`✓ Organizer ${organizerId} is already verified and active`);
      }
    }

    return {
      success: true,
      message: `Verified ${organizerIds.size} organizers from events:\n${results.join('\n')}`
    };

  } catch (error: any) {
    console.error('[INIT ROLES] ❌ Error verifying organizers:', error);
    return {
      success: false,
      message: 'Failed to verify organizers',
      errors: [error.message]
    };
  }
}

export async function verifyAndFixAllRoles(): Promise<InitRoleResult> {
  console.log('[INIT ROLES] 🚀 Starting comprehensive role verification...');

  const results: string[] = [];
  let hasErrors = false;

  const superAdminResult = await initSuperAdminRole();
  results.push(superAdminResult.message);
  if (!superAdminResult.success) {
    hasErrors = true;
    if (superAdminResult.errors) {
      results.push(...superAdminResult.errors);
    }
  }

  const organizersResult = await verifyOrganizersByEvents();
  results.push(organizersResult.message);
  if (!organizersResult.success) {
    hasErrors = true;
    if (organizersResult.errors) {
      results.push(...organizersResult.errors);
    }
  }

  return {
    success: !hasErrors,
    message: results.join('\n\n')
  };
}
