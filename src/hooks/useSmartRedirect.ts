import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { getDefaultRedirectForRole, UserRole, canAccessRoute } from '../lib/rolePermissions';

const getAdminUID = () => {
  if (typeof window !== 'undefined' && (window as any).ENV?.ADMIN_UID) {
    return (window as any).ENV.ADMIN_UID;
  }
  return import.meta.env.VITE_ADMIN_UID || 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
};

export function useSmartRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.log('[SmartRedirect] No user, staying on current page');
      return;
    }

    if (!user.role) {
      console.log('[SmartRedirect] No role assigned, redirecting to home');
      navigate('/', { replace: true });
      return;
    }

    const userRole = user.role as UserRole;
    const currentPath = location.pathname;

    if (currentPath === '/admin/login' || currentPath === '/admin/unified-login') {
      const isSuperAdmin = user.uid === getAdminUID();

      if (isSuperAdmin) {
        console.log('[SmartRedirect] Super Admin on login page - allowing access for account activation');
        return;
      }

      const defaultPath = getDefaultRedirectForRole(userRole);
      console.log('[SmartRedirect] User logged in, redirecting to:', defaultPath);
      navigate(defaultPath, { replace: true });
      return;
    }

    const hasAccess = canAccessRoute(userRole, currentPath);

    if (!hasAccess && currentPath.startsWith('/admin')) {
      const defaultPath = getDefaultRedirectForRole(userRole);
      console.log('[SmartRedirect] User lacks access to', currentPath, '→ Redirecting to:', defaultPath);
      navigate(defaultPath, { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);
}
