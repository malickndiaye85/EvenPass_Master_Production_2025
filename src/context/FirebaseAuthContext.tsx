import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../types';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
    try {
      const isAdmin = firebaseUser.uid === ADMIN_UID;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', firebaseUser.uid)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error loading user:', userError);
      }

      const { data: organizer } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', firebaseUser.uid)
        .maybeSingle();

      const { data: admin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', firebaseUser.uid)
        .maybeSingle();

      let role: 'customer' | 'organizer' | 'admin' | 'staff' = 'customer';
      if (isAdmin || (admin && admin.is_active)) {
        role = 'admin';
      } else if (organizer && organizer.is_active) {
        role = 'organizer';
      }

      setUser({
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
        organizer: organizer || undefined,
        admin: admin || undefined,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signOut }}>
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
