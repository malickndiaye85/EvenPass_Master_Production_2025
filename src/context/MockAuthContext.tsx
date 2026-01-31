import { createContext, useContext, useState } from 'react';
import type { AuthUser } from '../types';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>({
    id: ADMIN_UID,
    email: 'admin@demdem.sn',
    full_name: 'Admin DemDem Transports & Events',
    phone: '+221771234567',
    avatar_url: null,
    preferred_language: 'fr',
    preferred_payment_method: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'admin',
    admin: {
      id: 'admin-1',
      user_id: ADMIN_UID,
      role: 'super_admin',
      permissions: ['all'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });

  const [firebaseUser] = useState({
    uid: ADMIN_UID,
    email: 'admin@demdem.sn',
    displayName: 'Admin DemDem Transports & Events',
    photoURL: null,
  });

  const signIn = async (email: string, password: string) => {
    console.log('[MOCK AUTH] Sign in:', email);

    if (email.includes('organisateur')) {
      setUser({
        id: 'org-user-1',
        email: email,
        full_name: 'Organisateur Test',
        phone: '+221771234568',
        avatar_url: null,
        preferred_language: 'fr',
        preferred_payment_method: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'organizer',
        organizer: {
          id: '1',
          user_id: 'org-user-1',
          organization_name: 'EventPro Sénégal',
          organization_type: 'company',
          verification_status: 'verified',
          contact_email: email,
          contact_phone: '+221771234568',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    } else {
      setUser({
        id: ADMIN_UID,
        email: 'admin@demdem.sn',
        full_name: 'Admin DemDem Transports & Events',
        phone: '+221771234567',
        avatar_url: null,
        preferred_language: 'fr',
        preferred_payment_method: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'admin',
        admin: {
          id: 'admin-1',
          user_id: ADMIN_UID,
          role: 'super_admin',
          permissions: ['all'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    return { error: null };
  };

  const signOut = async () => {
    console.log('[MOCK AUTH] Sign out');
    setUser({
      id: ADMIN_UID,
      email: 'admin@demdem.sn',
      full_name: 'Admin DemDem Transports & Events',
      phone: '+221771234567',
      avatar_url: null,
      preferred_language: 'fr',
      preferred_payment_method: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: 'admin',
      admin: {
        id: 'admin-1',
        user_id: ADMIN_UID,
        role: 'super_admin',
        permissions: ['all'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
}
