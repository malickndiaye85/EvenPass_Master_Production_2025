export type UserRole =
  | 'super_admin'
  | 'sub_admin'
  | 'ops_manager'
  | 'ops_event'
  | 'ops_transport'
  | 'admin_finance_event'
  | 'admin_finance_voyage'
  | 'admin_maritime'
  | 'organizer'
  | 'controller'
  | 'driver'
  | 'customer';

export type Silo = 'événement' | 'voyage' | 'transversal' | 'all';

export interface RolePermission {
  role: UserRole;
  silo: Silo;
  allowedRoutes: string[];
  defaultRedirect: string;
  canAccessTransversal: boolean;
  canAccessFinance: boolean;
  canManageStaff: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  super_admin: {
    role: 'super_admin',
    silo: 'all',
    allowedRoutes: ['*'],
    defaultRedirect: '/admin/transversal',
    canAccessTransversal: true,
    canAccessFinance: true,
    canManageStaff: true
  },
  sub_admin: {
    role: 'sub_admin',
    silo: 'all',
    allowedRoutes: ['/admin/ops', '/admin/ops/maritime', '/admin/transport/setup'],
    defaultRedirect: '/admin/ops',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  ops_manager: {
    role: 'ops_manager',
    silo: 'all',
    allowedRoutes: ['/admin/ops', '/admin/ops/maritime'],
    defaultRedirect: '/admin/ops',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  ops_event: {
    role: 'ops_event',
    silo: 'événement',
    allowedRoutes: ['/admin/ops', '/organizer/dashboard'],
    defaultRedirect: '/admin/ops',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  ops_transport: {
    role: 'ops_transport',
    silo: 'voyage',
    allowedRoutes: ['/admin/ops', '/admin/transport/setup', '/voyage/chauffeur/dashboard', '/voyage/conducteur/dashboard'],
    defaultRedirect: '/admin/ops',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  admin_finance_event: {
    role: 'admin_finance_event',
    silo: 'événement',
    allowedRoutes: ['/admin/finance'],
    defaultRedirect: '/admin/finance',
    canAccessTransversal: false,
    canAccessFinance: true,
    canManageStaff: false
  },
  admin_finance_voyage: {
    role: 'admin_finance_voyage',
    silo: 'voyage',
    allowedRoutes: ['/admin/finance'],
    defaultRedirect: '/admin/finance',
    canAccessTransversal: false,
    canAccessFinance: true,
    canManageStaff: false
  },
  admin_maritime: {
    role: 'admin_maritime',
    silo: 'voyage',
    allowedRoutes: ['/admin/ops/maritime', '/pass/commandant', '/pass/boarding', '/pass/commercial'],
    defaultRedirect: '/admin/ops/maritime',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  organizer: {
    role: 'organizer',
    silo: 'événement',
    allowedRoutes: ['/organizer/dashboard', '/organizer/pending'],
    defaultRedirect: '/organizer/dashboard',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  controller: {
    role: 'controller',
    silo: 'événement',
    allowedRoutes: ['/scan'],
    defaultRedirect: '/scan',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  driver: {
    role: 'driver',
    silo: 'voyage',
    allowedRoutes: ['/voyage/chauffeur/dashboard', '/voyage/chauffeur/publier-trajet', '/voyage/conducteur/dashboard', '/voyage/conducteur/trajet'],
    defaultRedirect: '/voyage/chauffeur/dashboard',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  },
  customer: {
    role: 'customer',
    silo: 'all',
    allowedRoutes: ['/evenement', '/voyage', '/success', '/error'],
    defaultRedirect: '/',
    canAccessTransversal: false,
    canAccessFinance: false,
    canManageStaff: false
  }
};

export function getRolePermissions(role: UserRole | undefined): RolePermission | null {
  if (!role) return null;
  return ROLE_PERMISSIONS[role] || null;
}

export function canAccessRoute(userRole: UserRole | undefined, requestedPath: string): boolean {
  if (!userRole) return false;

  const permissions = getRolePermissions(userRole);
  if (!permissions) return false;

  if (permissions.allowedRoutes.includes('*')) return true;

  return permissions.allowedRoutes.some(route => {
    if (route.endsWith('*')) {
      const baseRoute = route.slice(0, -1);
      return requestedPath.startsWith(baseRoute);
    }
    return requestedPath.startsWith(route);
  });
}

export function getDefaultRedirectForRole(userRole: UserRole | undefined): string {
  if (!userRole) return '/';
  const permissions = getRolePermissions(userRole);
  return permissions?.defaultRedirect || '/';
}

export function hasTransversalAccess(userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  const permissions = getRolePermissions(userRole);
  return permissions?.canAccessTransversal || false;
}

export function hasFinanceAccess(userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  const permissions = getRolePermissions(userRole);
  return permissions?.canAccessFinance || false;
}

export function hasStaffManagementAccess(userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  const permissions = getRolePermissions(userRole);
  return permissions?.canManageStaff || false;
}

export function getUserSilo(userRole: UserRole | undefined): Silo {
  if (!userRole) return 'all';
  const permissions = getRolePermissions(userRole);
  return permissions?.silo || 'all';
}
