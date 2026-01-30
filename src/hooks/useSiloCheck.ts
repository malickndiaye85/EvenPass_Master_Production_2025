import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';

export type SiloType = 'voyage' | 'evenement' | 'admin' | null;

interface SiloCheckOptions {
  requiredSilo: SiloType;
  redirectTo?: string;
  allowAdmin?: boolean;
}

export function useSiloCheck({ requiredSilo, redirectTo = '/', allowAdmin = true }: SiloCheckOptions) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      setChecking(true);
      return;
    }

    if (!user) {
      console.log('[SILO CHECK] No user, redirecting to', redirectTo);
      navigate(redirectTo);
      setChecking(false);
      return;
    }

    const userSiloId = user.silo_id || null;
    const userRole = user.role || '';

    console.log('[SILO CHECK] User:', user.id, 'Role:', userRole, 'Silo:', userSiloId, 'Required:', requiredSilo);

    if (allowAdmin && (userRole === 'super_admin' || userRole === 'admin')) {
      console.log('[SILO CHECK] Admin access granted');
      setIsAuthorized(true);
      setChecking(false);
      return;
    }

    if (requiredSilo === null) {
      console.log('[SILO CHECK] No silo required, access granted');
      setIsAuthorized(true);
      setChecking(false);
      return;
    }

    if (userSiloId === requiredSilo) {
      console.log('[SILO CHECK] Silo match, access granted');
      setIsAuthorized(true);
      setChecking(false);
      return;
    }

    console.log('[SILO CHECK] Silo mismatch, access denied. Redirecting to', redirectTo);
    navigate(redirectTo);
    setChecking(false);
  }, [user, loading, requiredSilo, redirectTo, allowAdmin, navigate]);

  return { isAuthorized, checking };
}

export function getSiloForRole(role: string): SiloType {
  if (role === 'driver' || role === 'driver_pending') {
    return 'voyage';
  }

  if (role === 'organizer' || role === 'organizer_pending') {
    return 'evenement';
  }

  if (role === 'super_admin' || role === 'admin') {
    return 'admin';
  }

  return null;
}

export function checkSiloAccess(userSiloId: SiloType, requiredSilo: SiloType, userRole: string): boolean {
  if (userRole === 'super_admin' || userRole === 'admin') {
    return true;
  }

  if (requiredSilo === null) {
    return true;
  }

  return userSiloId === requiredSilo;
}
