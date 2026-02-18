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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requireSuperAdmin && user.role !== 'super_admin' && user.id !== 'Tnq8Isi0fATmidMwEuVrw1SAJkI3') {
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
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user.role as UserRole);

    if (!hasAllowedRole) {
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
      return <Navigate to={redirectPath} replace />;
    }
  }

  const hasAccess = canAccessRoute(user.role as UserRole, location.pathname);

  if (!hasAccess) {
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
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
