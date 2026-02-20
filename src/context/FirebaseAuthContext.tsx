import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firestore } from '../firebase';
import type { AuthUser } from '../types';
import { securityLogger } from '../lib/securityLogger';

const getAdminUID = () => {
  if (typeof window !== 'undefined' && (window as any).ENV?.ADMIN_UID) {
    return (window as any).ENV.ADMIN_UID;
  }
  return import.meta.env.VITE_ADMIN_UID || 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
};

const ADMIN_UID = getAdminUID();

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActivatingAccount, setIsActivatingAccount] = useState(false);

  useEffect(() => {
    if (!auth) {
      console.warn('[FIREBASE AUTH] Firebase auth not configured');
      setLoading(false);
      return;
    }

    console.log('[FIREBASE AUTH] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[FIREBASE AUTH] Auth state changed:', {
        authenticated: !!firebaseUser,
        email: firebaseUser?.email,
        uid: firebaseUser?.uid,
        isActivatingAccount
      });

      if (isActivatingAccount) {
        console.log('[FIREBASE AUTH] ⏸️ Account activation in progress, skipping profile load');
        return;
      }

      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isActivatingAccount]);

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    console.log('[FIREBASE AUTH] ⏳ Starting loadUserProfile for:', firebaseUser.uid);
    const startTime = Date.now();

    try {
      console.log('[FIREBASE AUTH] Loading user profile for:', firebaseUser.uid);
      const isAdmin = firebaseUser.uid === ADMIN_UID ||
                      firebaseUser.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3' ||
                      firebaseUser.email === 'sn.malickndiaye@gmail.com';
      console.log('[FIREBASE AUTH] Is admin UID?', isAdmin, 'UID:', firebaseUser.uid, 'Email:', firebaseUser.email, 'Expected:', ADMIN_UID);

      let userData = null;
      let organizerData = null;
      let adminData = null;
      let driverData = null;
      let organizerFirestoreData = null;

      // VÉRIFIER D'ABORD SI C'EST UN CHAUFFEUR OU ORGANISATEUR (Firestore)
      if (firestore) {
        try {
          const driverRef = doc(firestore, 'drivers', firebaseUser.uid);
          const driverSnapshot = await getDoc(driverRef);
          if (driverSnapshot.exists()) {
            driverData = driverSnapshot.data();
            console.log('[FIREBASE AUTH] 🚗 Driver data loaded:', {
              exists: true,
              status: driverData.status,
              verified: driverData.verified,
              firstName: driverData.firstName
            });
          } else {
            console.log('[FIREBASE AUTH] 🚗 No driver document found for UID:', firebaseUser.uid);
          }
        } catch (error: any) {
          console.warn('[FIREBASE AUTH] Could not load driver data:', error);
        }

        try {
          const organizerRef = doc(firestore, 'organizers', firebaseUser.uid);
          const organizerSnapshot = await getDoc(organizerRef);
          if (organizerSnapshot.exists()) {
            organizerFirestoreData = organizerSnapshot.data();
            console.log('[FIREBASE AUTH] 🎪 Organizer data loaded from Firestore:', {
              exists: true,
              status: organizerFirestoreData.verification_status || organizerFirestoreData.status,
              orgName: organizerFirestoreData.organization_name,
              email: organizerFirestoreData.email || organizerFirestoreData.contact_email
            });
          } else {
            console.log('[FIREBASE AUTH] 🎪 No organizer document found in Firestore for UID:', firebaseUser.uid);
          }
        } catch (error: any) {
          console.warn('[FIREBASE AUTH] Could not load organizer data from Firestore:', error);
        }
      }

      if (db) {
        console.log(`[AUTH-SYNC] Email connecté: ${firebaseUser.email}`);

        try {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const userSnapshot = await get(userRef);
          userData = userSnapshot.val();
          console.log('[FIREBASE AUTH] User data loaded by UID:', !!userData);
        } catch (error: any) {
          if (error?.code === 'PERMISSION_DENIED') {
            console.error('[FIREBASE AUTH] ❌ 403 PERMISSION DENIED: Vérifiez les Firebase Security Rules pour users/');
          }
          console.warn('[FIREBASE AUTH] Could not load user data by UID:', error);
        }

        if (!userData || !userData.role) {
          console.log('[AUTH-SYNC] Rôle non trouvé par UID, recherche par email dans /users/...');
          try {
            const usersRef = ref(db, 'users');
            const usersSnapshot = await get(usersRef);
            if (usersSnapshot.exists()) {
              const allUsers = usersSnapshot.val();
              const matchingUser = Object.entries(allUsers).find(
                ([_, user]: [string, any]) => user.email === firebaseUser.email
              );
              if (matchingUser) {
                const [foundUid, foundUserData] = matchingUser as [string, any];
                userData = foundUserData;
                console.log(`[AUTH-SYNC] ✅ Utilisateur trouvé par email dans /users/${foundUid}:`, { role: userData.role });
              } else {
                console.log('[AUTH-SYNC] ❌ Aucun utilisateur trouvé avec cet email dans /users/');
              }
            }
          } catch (error: any) {
            console.warn('[AUTH-SYNC] Erreur lors de la recherche par email:', error);
          }
        }

        try {
          const organizerRef = ref(db, `organizers/${firebaseUser.uid}`);
          const organizerSnapshot = await get(organizerRef);
          organizerData = organizerSnapshot.val();
          console.log('[FIREBASE AUTH] Organizer data loaded:', {
            exists: !!organizerData,
            fullData: organizerData,
            isActive: organizerData?.is_active,
            status: organizerData?.verification_status,
            orgName: organizerData?.organization_name
          });
        } catch (error: any) {
          if (error?.code === 'PERMISSION_DENIED') {
            console.error('[FIREBASE AUTH] ❌ 403 PERMISSION DENIED: Vérifiez les Firebase Security Rules pour organizers/');
          }
          console.warn('[FIREBASE AUTH] Could not load organizer data:', error);
        }

        try {
          const adminRef = ref(db, `admins/${firebaseUser.uid}`);
          const adminSnapshot = await get(adminRef);
          adminData = adminSnapshot.val();
          console.log('[FIREBASE AUTH] Admin data loaded by UID:', {
            exists: !!adminData,
            isActive: adminData?.is_active
          });
        } catch (error: any) {
          if (error?.code === 'PERMISSION_DENIED') {
            console.error('[FIREBASE AUTH] ❌ 403 PERMISSION DENIED sur admins/: Vérifiez que cet UID a les privilèges admin dans Firebase Security Rules');
          }
          console.warn('[FIREBASE AUTH] Could not load admin data by UID:', error);
        }

        if (!adminData || !adminData.role) {
          console.log('[AUTH-SYNC] Admin non trouvé par UID, recherche par email dans /admins/...');
          try {
            const adminsRef = ref(db, 'admins');
            const adminsSnapshot = await get(adminsRef);
            if (adminsSnapshot.exists()) {
              const allAdmins = adminsSnapshot.val();
              const matchingAdmin = Object.entries(allAdmins).find(
                ([_, admin]: [string, any]) => admin.email === firebaseUser.email
              );
              if (matchingAdmin) {
                const [foundUid, foundAdminData] = matchingAdmin as [string, any];
                adminData = foundAdminData;
                console.log(`[AUTH-SYNC] ✅ Admin trouvé par email dans /admins/${foundUid}:`, { role: adminData.role, silo: adminData.silo });
              } else {
                console.log('[AUTH-SYNC] ❌ Aucun admin trouvé avec cet email dans /admins/');
              }
            }
          } catch (error: any) {
            console.warn('[AUTH-SYNC] Erreur lors de la recherche admin par email:', error);
          }
        }
      } else {
        console.warn('[FIREBASE AUTH] Firebase database not configured');
      }

      let role: any = 'customer';

      console.log('[FIREBASE AUTH] Role determination checks:', {
        isAdmin,
        hasAdminData: !!adminData,
        hasDriverData: !!driverData,
        hasOrganizerFirestoreData: !!organizerFirestoreData,
        hasOrganizerRealtimeData: !!organizerData,
        hasUserData: !!userData,
        userDataRole: userData?.role,
        driverStatus: driverData?.status,
        organizerFirestoreStatus: organizerFirestoreData?.verification_status || organizerFirestoreData?.status,
        organizerRealtimeStatus: organizerData?.verification_status
      });

      if (isAdmin) {
        role = 'super_admin';
        console.log('[FIREBASE AUTH] ✅ Role set to SUPER ADMIN (Master UID)');
        console.log(`[AUTH-SYNC] Rôle récupéré via Email: ${role}`);
      } else if (adminData && adminData.role) {
        role = adminData.role;
        console.log('[FIREBASE AUTH] ✅ Role detected from admins table:', role);
        console.log(`[AUTH-SYNC] Rôle récupéré via Email: ${role}`);
      } else if (userData && userData.role) {
        role = userData.role;
        console.log('[FIREBASE AUTH] ✅ Role detected from users table:', role);
        console.log(`[AUTH-SYNC] Rôle récupéré via Email: ${role}`);
      } else if (adminData && adminData.is_active) {
        role = 'admin';
        console.log('[FIREBASE AUTH] ✅ Role set to ADMIN (adminData exists but no specific role)');
        console.log(`[AUTH-SYNC] Rôle récupéré via Email: ${role}`);
      } else if (driverData) {
        role = 'driver';
        console.log('[FIREBASE AUTH] 🚗 ✅ Role set to DRIVER (driver document exists)');
      } else if (organizerFirestoreData || organizerData) {
        role = 'organizer';
        console.log('[FIREBASE AUTH] 🎪 ✅ Role set to ORGANIZER (organizer document exists in Firestore or Realtime DB)');
      } else {
        role = 'customer';
        console.log('[FIREBASE AUTH] 👤 Role set to CUSTOMER (no special role found)');
        console.log(`[AUTH-SYNC] ❌ Aucun rôle admin trouvé pour l'email: ${firebaseUser.email}. Redirigera vers /voyage`);
      }

      console.log('[FIREBASE AUTH] 🎯 Final determined role:', role);

      const userProfile: AuthUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        full_name: userData?.full_name || firebaseUser.displayName || 'Utilisateur',
        phone: userData?.phone || null,
        avatar_url: userData?.avatar_url || firebaseUser.photoURL || null,
        preferred_language: userData?.preferred_language || 'fr',
        preferred_payment_method: userData?.preferred_payment_method || null,
        created_at: userData?.created_at || new Date().toISOString(),
        updated_at: userData?.updated_at || new Date().toISOString(),
        role,
        organizer: (organizerFirestoreData || organizerData) ? {
          id: firebaseUser.uid,
          user_id: firebaseUser.uid,
          organization_name: organizerFirestoreData?.organization_name || organizerData?.organization_name,
          organization_type: organizerFirestoreData?.organization_type || organizerData?.organization_type || 'company',
          verification_status: organizerFirestoreData?.verification_status || organizerFirestoreData?.status || organizerData?.verification_status || 'verified',
          contact_email: organizerFirestoreData?.contact_email || organizerFirestoreData?.email || organizerData?.contact_email || firebaseUser.email,
          contact_phone: organizerFirestoreData?.contact_phone || organizerFirestoreData?.phone || organizerData?.contact_phone || userData?.phone,
          is_active: organizerFirestoreData?.is_active ?? organizerData?.is_active ?? true,
          created_at: organizerFirestoreData?.created_at || organizerData?.created_at || new Date().toISOString(),
          updated_at: organizerFirestoreData?.updated_at || organizerData?.updated_at || new Date().toISOString(),
        } : undefined,
        admin: adminData ? {
          id: firebaseUser.uid,
          user_id: firebaseUser.uid,
          role: adminData.role || 'super_admin',
          permissions: adminData.permissions || ['all'],
          is_active: adminData.is_active || true,
          created_at: adminData.created_at || new Date().toISOString(),
          updated_at: adminData.updated_at || new Date().toISOString(),
        } : undefined,
      };

      console.log('[FIREBASE AUTH] User profile created:', {
        email: userProfile.email,
        role: userProfile.role,
        hasOrganizer: !!userProfile.organizer,
        hasAdmin: !!userProfile.admin
      });

      setUser(userProfile);
      console.log('[FIREBASE AUTH] ✅ User state updated successfully');
    } catch (error) {
      console.error('[FIREBASE AUTH] Critical error loading user profile:', error);

      const isAdmin = firebaseUser.uid === ADMIN_UID;
      setUser({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        full_name: firebaseUser.displayName || 'Super Admin',
        phone: null,
        avatar_url: firebaseUser.photoURL || null,
        preferred_language: 'fr',
        preferred_payment_method: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: isAdmin ? 'super_admin' : 'customer',
      });
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[FIREBASE AUTH] ✅ loadUserProfile completed in ${duration}ms`);
      setLoading(false);
      console.log('[FIREBASE AUTH] Loading state set to FALSE');
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[FIREBASE AUTH] 🔐 signIn called for:', email);
    if (!auth) {
      console.error('[FIREBASE AUTH] ❌ Auth not configured!');
      return { error: new Error('Firebase auth not configured') };
    }
    try {
      console.log('[FIREBASE AUTH] Calling signInWithEmailAndPassword...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('[FIREBASE AUTH] ✅ signInWithEmailAndPassword successful');
      console.log('[FIREBASE AUTH] onAuthStateChanged should trigger now...');

      if (result.user) {
        const tempRole = result.user.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3' ? 'super_admin' : 'customer';
        await securityLogger.logLogin(
          result.user.email || email,
          result.user.uid,
          tempRole,
          true
        );
      }

      return { error: null };
    } catch (error: any) {
      console.error('[FIREBASE AUTH] ❌ Sign in error:', error);

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        console.log('[FIREBASE AUTH] Checking if this is a pre-registered staff account...');
        try {
          if (db) {
            const usersRef = ref(db, 'users');
            const usersSnapshot = await get(usersRef);

            if (usersSnapshot.exists()) {
              const usersData = usersSnapshot.val();
              const preRegisteredAccount = Object.entries(usersData).find(([uid, userData]: [string, any]) => {
                return userData.email?.toLowerCase() === email.toLowerCase() &&
                       userData.pending_activation === true &&
                       userData.password === password;
              });

              if (preRegisteredAccount) {
                const [tempId, accountData]: [string, any] = preRegisteredAccount;
                console.log('[FIREBASE AUTH] ✅ Pre-registered account found! Activating...', tempId);

                setIsActivatingAccount(true);

                console.log('[FIREBASE AUTH] Creating Firebase Auth account...');
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const realUid = userCredential.user.uid;
                console.log('[FIREBASE AUTH] ✅ Firebase Auth account created with UID:', realUid);

                const newUserData = {
                  email: accountData.email,
                  role: accountData.role,
                  silo: accountData.silo,
                  silo_id: accountData.silo_id,
                  full_name: accountData.full_name || email.split('@')[0],
                  created_at: accountData.created_at,
                  updated_at: new Date().toISOString(),
                  activated_at: new Date().toISOString(),
                  pending_activation: false
                };

                await set(ref(db, `users/${realUid}`), newUserData);
                console.log('[FIREBASE AUTH] ✅ User profile migrated to real UID');

                const staffRef = ref(db, `staff/${tempId}`);
                const staffSnapshot = await get(staffRef);
                if (staffSnapshot.exists()) {
                  const staffData = staffSnapshot.val();
                  await set(ref(db, `staff/${realUid}`), {
                    ...staffData,
                    id: realUid,
                    activated_at: new Date().toISOString()
                  });
                  console.log('[FIREBASE AUTH] ✅ Staff data migrated to real UID');
                }

                await securityLogger.logLogin(
                  email,
                  realUid,
                  accountData.role,
                  true
                );

                setIsActivatingAccount(false);

                console.log('[FIREBASE AUTH] ✅ Staff account activated successfully! Now loading profile...');
                await loadUserProfile(userCredential.user);

                return { error: null };
              }
            }
          }
        } catch (activationError) {
          console.error('[FIREBASE AUTH] ❌ Error during account activation:', activationError);
        }
      }

      await securityLogger.logLogin(
        email,
        'unknown',
        'unknown',
        false,
        (error as Error).message
      );

      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('[FIREBASE AUTH] 📝 signUp called for:', email);
    if (!auth) {
      console.error('[FIREBASE AUTH] ❌ Auth not configured!');
      return { error: new Error('Firebase auth not configured') };
    }
    try {
      console.log('[FIREBASE AUTH] Checking if this is a pre-registered staff account...');
      if (db) {
        const usersRef = ref(db, 'users');
        const usersSnapshot = await get(usersRef);

        if (usersSnapshot.exists()) {
          const usersData = usersSnapshot.val();
          const preRegisteredAccount = Object.entries(usersData).find(([uid, userData]: [string, any]) => {
            return userData.email?.toLowerCase() === email.toLowerCase() &&
                   userData.pending_activation === true &&
                   userData.password === password;
          });

          if (preRegisteredAccount) {
            const [tempId, accountData]: [string, any] = preRegisteredAccount;
            console.log('[FIREBASE AUTH] ✅ Pre-registered account found! Activating...', tempId);

            console.log('[FIREBASE AUTH] Creating Firebase Auth account...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const realUid = userCredential.user.uid;
            console.log('[FIREBASE AUTH] ✅ Firebase Auth account created with UID:', realUid);

            const newUserData = {
              email: accountData.email,
              role: accountData.role,
              silo: accountData.silo,
              silo_id: accountData.silo_id,
              full_name: accountData.full_name || email.split('@')[0],
              created_at: accountData.created_at,
              updated_at: new Date().toISOString(),
              activated_at: new Date().toISOString(),
              pending_activation: false
            };

            await set(ref(db, `users/${realUid}`), newUserData);
            console.log('[FIREBASE AUTH] ✅ User profile migrated to real UID');

            const staffRef = ref(db, `staff/${tempId}`);
            const staffSnapshot = await get(staffRef);
            if (staffSnapshot.exists()) {
              const staffData = staffSnapshot.val();
              await set(ref(db, `staff/${realUid}`), {
                ...staffData,
                id: realUid,
                activated_at: new Date().toISOString()
              });
              console.log('[FIREBASE AUTH] ✅ Staff data migrated to real UID');
            }

            console.log('[FIREBASE AUTH] ✅ Staff account activated successfully!');
            return { error: null };
          }
        }
      }

      console.log('[FIREBASE AUTH] Creating new Firebase Auth account...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[FIREBASE AUTH] ✅ Account created successfully');

      return { error: null };
    } catch (error) {
      console.error('[FIREBASE AUTH] ❌ Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (!auth) {
      console.warn('[FIREBASE AUTH] Cannot sign out - auth not configured');
      return;
    }

    if (user?.email && user?.id && user?.role) {
      await securityLogger.logLogout(user.email, user.id, user.role);
    }

    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signUp, signOut, logout: signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
