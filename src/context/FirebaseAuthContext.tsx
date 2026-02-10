import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firestore } from '../firebase';
import type { AuthUser } from '../types';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

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
        uid: firebaseUser?.uid
      });
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

      // VÉRIFIER D'ABORD SI C'EST UN CHAUFFEUR (Firestore)
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
      }

      if (db) {
        try {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const userSnapshot = await get(userRef);
          userData = userSnapshot.val();
          console.log('[FIREBASE AUTH] User data loaded:', !!userData);
        } catch (error: any) {
          if (error?.code === 'PERMISSION_DENIED') {
            console.error('[FIREBASE AUTH] ❌ 403 PERMISSION DENIED: Vérifiez les Firebase Security Rules pour users/');
          }
          console.warn('[FIREBASE AUTH] Could not load user data:', error);
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
          console.log('[FIREBASE AUTH] Admin data loaded:', {
            exists: !!adminData,
            isActive: adminData?.is_active
          });
        } catch (error: any) {
          if (error?.code === 'PERMISSION_DENIED') {
            console.error('[FIREBASE AUTH] ❌ 403 PERMISSION DENIED sur admins/: Vérifiez que cet UID a les privilèges admin dans Firebase Security Rules');
          }
          console.warn('[FIREBASE AUTH] Could not load admin data:', error);
        }
      } else {
        console.warn('[FIREBASE AUTH] Firebase database not configured');
      }

      let role: 'customer' | 'organizer' | 'admin' | 'super_admin' | 'staff' | 'driver' = 'customer';

      console.log('[FIREBASE AUTH] Role determination checks:', {
        isAdmin,
        hasDriverData: !!driverData,
        driverStatus: driverData?.status,
        driverVerified: driverData?.verified,
        hasOrganizerData: !!organizerData,
        organizerIsActive: organizerData?.is_active,
        organizerIsActiveType: typeof organizerData?.is_active,
        organizerStatus: organizerData?.verification_status,
        organizerStatusType: typeof organizerData?.verification_status
      });

      if (isAdmin) {
        role = 'super_admin';
        console.log('[FIREBASE AUTH] ✅ Role set to SUPER ADMIN (Master UID)');
      } else if (adminData && adminData.is_active) {
        role = 'admin';
        console.log('[FIREBASE AUTH] ✅ Role set to admin (adminData exists)');
      } else if (driverData && (driverData.status === 'verified' || driverData.verified === true)) {
        role = 'driver';
        console.log('[FIREBASE AUTH] 🚗 ✅ Role set to DRIVER (verified)');
      } else if (driverData && (driverData.status === 'pending' || driverData.status === 'pending_verification')) {
        console.log('[FIREBASE AUTH] 🚗 ⏳ Driver account pending verification');
      } else if (organizerData) {
        if (organizerData.is_active === true && organizerData.verification_status === 'verified') {
          role = 'organizer';
          console.log('[FIREBASE AUTH] ✅ Role set to organizer (verified)');
        } else if (organizerData.verification_status === 'pending') {
          console.log('[FIREBASE AUTH] ⏳ Organizer pending verification');
        } else {
          console.log('[FIREBASE AUTH] Organizer data exists but conditions not met:', {
            is_active: organizerData.is_active,
            is_active_equals_true: organizerData.is_active === true,
            verification_status: organizerData.verification_status,
            verification_status_equals_verified: organizerData.verification_status === 'verified'
          });
        }
      }

      console.log('[FIREBASE AUTH] 🎯 Final determined role:', role);

      const userProfile: AuthUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        full_name: userData?.full_name || firebaseUser.displayName || 'Utilisateur',
        phone: userData?.phone || null,
        avatar_url: userData?.avatar_url || firebaseUser.photoURL || null,
        preferred_language: userData?.preferred_language || 'fr',
        preferred_payment_method: userData?.preferred_payment_method || null,
        created_at: userData?.created_at || new Date().toISOString(),
        updated_at: userData?.updated_at || new Date().toISOString(),
        role,
        organizer: organizerData ? {
          id: firebaseUser.uid,
          user_id: firebaseUser.uid,
          organization_name: organizerData.organization_name,
          organization_type: organizerData.organization_type || 'company',
          verification_status: organizerData.verification_status || 'pending',
          contact_email: organizerData.contact_email || firebaseUser.email,
          contact_phone: organizerData.contact_phone || userData?.phone,
          is_active: organizerData.is_active || false,
          created_at: organizerData.created_at || new Date().toISOString(),
          updated_at: organizerData.updated_at || new Date().toISOString(),
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
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[FIREBASE AUTH] ✅ signInWithEmailAndPassword successful');
      console.log('[FIREBASE AUTH] onAuthStateChanged should trigger now...');
      return { error: null };
    } catch (error) {
      console.error('[FIREBASE AUTH] ❌ Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (!auth) {
      console.warn('[FIREBASE AUTH] Cannot sign out - auth not configured');
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signOut, logout: signOut }}>
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
