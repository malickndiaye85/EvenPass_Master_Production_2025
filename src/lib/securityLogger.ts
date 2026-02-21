import { ref, push, set } from 'firebase/database';
import { db } from '../firebase';

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'access_granted'
  | 'access_denied'
  | 'staff_created'
  | 'staff_deleted'
  | 'role_updated'
  | 'unauthorized_attempt'
  | 'route_accessed'
  | 'data_export'
  | 'finance_access';

export interface SecurityLogEntry {
  timestamp: string;
  event_type: SecurityEventType;
  user_email?: string;
  user_id?: string;
  user_role?: string;
  action: string;
  target?: string;
  route?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

class SecurityLogger {
  private static instance: SecurityLogger;

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  public async log(entry: Omit<SecurityLogEntry, 'timestamp'>): Promise<void> {
    try {
      if (!db) {
        console.warn('[SecurityLogger] Firebase Database not initialized');
        return;
      }

      const sanitizedEntry = {
        ...entry,
        user_id: entry.user_id || 'unknown',
        user_email: entry.user_email || 'unknown',
        user_role: entry.user_role || 'unknown'
      };

      const logEntry: SecurityLogEntry = {
        ...sanitizedEntry,
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };

      console.log('[SecurityLogger] 📝 Creating log entry:', {
        event_type: logEntry.event_type,
        user_id: logEntry.user_id,
        user_email: logEntry.user_email,
        action: logEntry.action
      });

      const logsRef = ref(db, 'admin_logs');
      const newLogRef = push(logsRef);
      await set(newLogRef, logEntry);

      console.log('[SecurityLogger] ✅ Log entry created:', logEntry.event_type);
    } catch (error) {
      console.error('[SecurityLogger] ❌ Failed to write log:', error);
    }
  }

  public async logLogin(
    userEmail: string,
    userId: string,
    userRole: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    console.log('[SecurityLogger] 🔐 logLogin called with:', { userEmail, userId, userRole, success });

    if (!userId) {
      console.warn('[SecurityLogger] ⚠️ logLogin called with undefined userId, skipping log');
      return;
    }

    await this.log({
      event_type: success ? 'login_success' : 'login_failed',
      user_email: userEmail || 'unknown',
      user_id: userId,
      user_role: userRole || 'unknown',
      action: `User login ${success ? 'successful' : 'failed'}`,
      success,
      error_message: errorMessage
    });
  }

  public async logLogout(userEmail: string, userId: string, userRole: string): Promise<void> {
    await this.log({
      event_type: 'logout',
      user_email: userEmail,
      user_id: userId,
      user_role: userRole,
      action: 'User logged out',
      success: true
    });
  }

  public async logRouteAccess(
    userEmail: string,
    userId: string,
    userRole: string,
    route: string,
    granted: boolean,
    reason?: string
  ): Promise<void> {
    const logData: any = {
      event_type: granted ? 'access_granted' : 'access_denied',
      user_email: userEmail || 'unknown',
      user_id: userId || 'unknown',
      user_role: userRole || 'unknown',
      route,
      action: `Route access ${granted ? 'granted' : 'denied'}: ${route}`,
      success: granted
    };

    if (reason) {
      logData.error_message = reason;
    }

    await this.log(logData);
  }

  public async logUnauthorizedAttempt(
    userEmail: string,
    userId: string,
    userRole: string,
    route: string,
    reason: string
  ): Promise<void> {
    await this.log({
      event_type: 'unauthorized_attempt',
      user_email: userEmail,
      user_id: userId,
      user_role: userRole,
      route,
      action: `Unauthorized access attempt to: ${route}`,
      success: false,
      error_message: reason
    });
  }

  public async logStaffCreation(
    adminEmail: string,
    adminId: string,
    targetEmail: string,
    targetRole: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      event_type: 'staff_created',
      user_email: adminEmail,
      user_id: adminId,
      user_role: 'super_admin',
      target: targetEmail,
      action: `Staff member created: ${targetEmail} with role ${targetRole}`,
      success,
      error_message: errorMessage,
      metadata: { target_role: targetRole }
    });
  }

  public async logStaffDeletion(
    adminEmail: string,
    adminId: string,
    targetEmail: string,
    success: boolean
  ): Promise<void> {
    await this.log({
      event_type: 'staff_deleted',
      user_email: adminEmail,
      user_id: adminId,
      user_role: 'super_admin',
      target: targetEmail,
      action: `Staff member deleted: ${targetEmail}`,
      success
    });
  }

  public async logRoleUpdate(
    adminEmail: string,
    adminId: string,
    targetEmail: string,
    oldRole: string,
    newRole: string,
    success: boolean
  ): Promise<void> {
    await this.log({
      event_type: 'role_updated',
      user_email: adminEmail,
      user_id: adminId,
      user_role: 'super_admin',
      target: targetEmail,
      action: `Role updated for ${targetEmail}: ${oldRole} → ${newRole}`,
      success,
      metadata: { old_role: oldRole, new_role: newRole }
    });
  }

  public async logDataExport(
    userEmail: string,
    userId: string,
    userRole: string,
    exportType: string,
    success: boolean
  ): Promise<void> {
    await this.log({
      event_type: 'data_export',
      user_email: userEmail,
      user_id: userId,
      user_role: userRole,
      action: `Data export: ${exportType}`,
      success,
      metadata: { export_type: exportType }
    });
  }

  public async logFinanceAccess(
    userEmail: string,
    userId: string,
    userRole: string,
    action: string,
    success: boolean
  ): Promise<void> {
    await this.log({
      event_type: 'finance_access',
      user_email: userEmail,
      user_id: userId,
      user_role: userRole,
      action: `Finance access: ${action}`,
      success
    });
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}

export const securityLogger = SecurityLogger.getInstance();
