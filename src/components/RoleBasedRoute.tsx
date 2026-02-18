import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { canAccessRoute, getDefaultRedirectForRole, UserRole } from '../lib/rolePermissions';
import { securityLogger } from '../lib/securityLogger';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireSuperAdmin?: boolean;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requireSuperAdmin = false
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      console.log('[ROLE BASED ROUTE] User role detected:', user.role, 'on path:', location.pathname);
      const granted = canAccessRoute(user.role as UserRole, location.pathname);

      if (user.email && user.id && user.role) {
        securityLogger.logRouteAccess(
          user.email,
          user.id,
          user.role,
          location.pathname,
          granted,
          granted ? undefined : 'Insufficient permissions'
        );
      }
    }
  }, [user, loading, location.pathname]);

  if (loading) {
    console.log('[ROLE BASED ROUTE] Loading... showing loader');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B]">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">🛡️</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Vérification de vos accès...</h3>
          <p className="text-gray-400">Analyse de vos permissions en cours</p>
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ROLE BASED ROUTE] No user, redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('[ROLE BASED ROUTE] User authenticated:', user.email, 'Role:', user.role);

  if (requireSuperAdmin && user.role !== 'super_admin' && user.id !== 'Tnq8Isi0fATmidMwEuVrw1SAJkI3') {
    console.log('[ROLE BASED ROUTE] Super admin required but user is:', user.role);
    if (user.email && user.id && user.role) {
      securityLogger.logUnauthorizedAttempt(
        user.email,
        user.id,
        user.role,
        location.pathname,
        'Super Admin access required'
      );
    }

    const redirectPath = getDefaultRedirectForRole(user.role as UserRole);
    console.log('[ROLE BASED ROUTE] Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user.role as UserRole);
    console.log('[ROLE BASED ROUTE] Checking allowed roles:', { userRole: user.role, allowedRoles, hasAllowedRole });

    if (!hasAllowedRole) {
      console.log('[ROLE BASED ROUTE] User role not in allowed roles');
      if (user.email && user.id && user.role) {
        securityLogger.logUnauthorizedAttempt(
          user.email,
          user.id,
          user.role,
          location.pathname,
          `Role ${user.role} not in allowed roles: ${allowedRoles.join(', ')}`
        );
      }

      const redirectPath = getDefaultRedirectForRole(user.role as UserRole);
      console.log('[ROLE BASED ROUTE] Redirecting to:', redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
  }

  const hasAccess = canAccessRoute(user.role as UserRole, location.pathname);
  console.log('[ROLE BASED ROUTE] Access check result:', hasAccess);

  if (!hasAccess) {
    console.log('[ROLE BASED ROUTE] Access denied');
    if (user.email && user.id && user.role) {
      securityLogger.logUnauthorizedAttempt(
        user.email,
        user.id,
        user.role,
        location.pathname,
        'Route not in allowed routes for this role'
      );
    }

    const redirectPath = getDefaultRedirectForRole(user.role as UserRole);
    console.log('[ROLE BASED ROUTE] Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  console.log('[ROLE BASED ROUTE] Access granted, rendering children');
  return <>{children}</>;
};

export default RoleBasedRoute;
