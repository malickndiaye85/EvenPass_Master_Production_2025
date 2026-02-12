import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

interface CancellationData {
  tripId: string;
  driverId: string;
  reason?: string;
  cancelledAt: number;
}

interface SecurityAlert {
  id: string;
  type: 'excessive_cancellations';
  driverId: string;
  driverName: string;
  driverPhone: string;
  cancellationCount: number;
  timeframe: string;
  createdAt: Timestamp;
  status: 'pending' | 'reviewed' | 'resolved';
  details: {
    cancellations: Array<{
      tripId: string;
      cancelledAt: number;
      origin: string;
      destination: string;
    }>;
  };
}

export class TripCancellationManager {
  static async cancelTrip(tripId: string, driverId: string, reason?: string): Promise<void> {
    try {
      console.log('[CANCELLATION] Starting cancellation process for trip:', tripId);

      const tripRef = doc(db, 'trips', tripId);
      const tripDoc = await getDoc(tripRef);

      if (!tripDoc.exists()) {
        throw new Error('Trip not found');
      }

      const tripData = tripDoc.data();

      await updateDoc(tripRef, {
        status: 'cancelled',
        cancelledBy: 'driver',
        cancelledAt: serverTimestamp(),
        cancellationReason: reason || 'Driver cancellation',
      });

      if (tripData.passengers && tripData.passengers.length > 0) {
        await this.reassignPassengers(tripId, tripData.passengers);
      }

      await this.recordCancellation({
        tripId,
        driverId,
        reason,
        cancelledAt: Date.now(),
      });

      await this.checkExcessiveCancellations(driverId);

      console.log('[CANCELLATION] ✅ Trip cancelled successfully');
    } catch (error) {
      console.error('[CANCELLATION] ❌ Error cancelling trip:', error);
      throw error;
    }
  }

  private static async reassignPassengers(
    tripId: string,
    passengers: Array<{ id: string; ticketId: string; userId: string; paid: boolean }>
  ): Promise<void> {
    console.log('[REASSIGNMENT] Reassigning passengers for cancelled trip:', tripId);

    for (const passenger of passengers) {
      if (!passenger.paid) continue;

      const ticketRef = doc(db, 'tickets', passenger.ticketId);
      const ticketDoc = await getDoc(ticketRef);

      if (ticketDoc.exists()) {
        await updateDoc(ticketRef, {
          status: 'reassign_pending',
          originalTripId: tripId,
          reassignableUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
          updatedAt: serverTimestamp(),
        });

        console.log(`[REASSIGNMENT] ✅ Ticket ${passenger.ticketId} marked as reassign_pending`);
      }

      const userRef = doc(db, 'users', passenger.userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          userId: passenger.userId,
          type: 'trip_cancelled',
          title: 'Trajet annulé',
          message: 'Votre trajet a été annulé par le chauffeur. Votre billet peut être utilisé pour réserver un autre trajet.',
          tripId,
          ticketId: passenger.ticketId,
          read: false,
          createdAt: serverTimestamp(),
        });

        console.log(`[NOTIFICATION] ✅ Notification sent to user ${passenger.userId}`);
      }
    }
  }

  private static async recordCancellation(data: CancellationData): Promise<void> {
    const cancellationRef = doc(collection(db, 'trip_cancellations'));
    await setDoc(cancellationRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    console.log('[CANCELLATION] ✅ Cancellation recorded in database');
  }

  private static async checkExcessiveCancellations(driverId: string): Promise<void> {
    const seventyTwoHoursAgo = Date.now() - 72 * 60 * 60 * 1000;

    const cancellationsQuery = query(
      collection(db, 'trip_cancellations'),
      where('driverId', '==', driverId),
      where('cancelledAt', '>=', seventyTwoHoursAgo)
    );

    const cancellationsSnapshot = await getDocs(cancellationsQuery);
    const cancellationCount = cancellationsSnapshot.size;

    console.log(`[SECURITY CHECK] Driver ${driverId} has ${cancellationCount} cancellations in last 72h`);

    if (cancellationCount > 3) {
      console.log('[SECURITY ALERT] ⚠️ Excessive cancellations detected! Creating alert...');
      await this.createSecurityAlert(driverId, cancellationsSnapshot.docs);
    }
  }

  private static async createSecurityAlert(
    driverId: string,
    cancellationDocs: any[]
  ): Promise<void> {
    const driverRef = doc(db, 'drivers', driverId);
    const driverDoc = await getDoc(driverRef);

    if (!driverDoc.exists()) {
      console.error('[SECURITY ALERT] Driver not found');
      return;
    }

    const driverData = driverDoc.data();

    const existingAlertQuery = query(
      collection(db, 'security_alerts'),
      where('driverId', '==', driverId),
      where('type', '==', 'excessive_cancellations'),
      where('status', '==', 'pending')
    );

    const existingAlerts = await getDocs(existingAlertQuery);

    if (!existingAlerts.empty) {
      console.log('[SECURITY ALERT] Alert already exists for this driver');
      return;
    }

    const cancellations = await Promise.all(
      cancellationDocs.map(async (doc) => {
        const data = doc.data();
        const tripRef = doc(db, 'trips', data.tripId);
        const tripDoc = await getDoc(tripRef);
        const tripData = tripDoc.exists() ? tripDoc.data() : {};

        return {
          tripId: data.tripId,
          cancelledAt: data.cancelledAt,
          origin: tripData.origin || 'Unknown',
          destination: tripData.destination || 'Unknown',
        };
      })
    );

    const alertRef = doc(collection(db, 'security_alerts'));
    const alert: SecurityAlert = {
      id: alertRef.id,
      type: 'excessive_cancellations',
      driverId,
      driverName: driverData.fullName || 'Unknown',
      driverPhone: driverData.phone || 'Unknown',
      cancellationCount: cancellationDocs.length,
      timeframe: '72 heures',
      createdAt: Timestamp.now(),
      status: 'pending',
      details: {
        cancellations,
      },
    };

    await setDoc(alertRef, alert);

    console.log('[SECURITY ALERT] ✅ Alert created for Ops Manager Transport');

    await this.notifyOpsManager(alert);
  }

  private static async notifyOpsManager(alert: SecurityAlert): Promise<void> {
    const opsManagersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'ops_transport')
    );

    const opsManagers = await getDocs(opsManagersQuery);

    for (const managerDoc of opsManagers.docs) {
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        userId: managerDoc.id,
        type: 'security_alert',
        title: 'Alerte Sécurité - Annulations Excessives',
        message: `Le chauffeur ${alert.driverName} a annulé ${alert.cancellationCount} trajets en 72h.`,
        alertId: alert.id,
        priority: 'high',
        read: false,
        createdAt: serverTimestamp(),
      });
    }

    console.log('[SECURITY ALERT] ✅ Ops Manager notified');
  }

  static async getDriverCancellationStats(driverId: string, days: number = 30): Promise<{
    total: number;
    last72h: number;
    last7d: number;
    last30d: number;
  }> {
    const now = Date.now();
    const last72h = now - 72 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;
    const last30d = now - 30 * 24 * 60 * 60 * 1000;

    const cancellationsQuery = query(
      collection(db, 'trip_cancellations'),
      where('driverId', '==', driverId)
    );

    const snapshot = await getDocs(cancellationsQuery);

    const stats = {
      total: 0,
      last72h: 0,
      last7d: 0,
      last30d: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const cancelledAt = data.cancelledAt;

      stats.total++;

      if (cancelledAt >= last72h) {
        stats.last72h++;
      }

      if (cancelledAt >= last7d) {
        stats.last7d++;
      }

      if (cancelledAt >= last30d) {
        stats.last30d++;
      }
    });

    return stats;
  }

  static async getReassignablePendingTickets(): Promise<any[]> {
    const now = Date.now();
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('status', '==', 'reassign_pending'),
      where('reassignableUntil', '>=', now)
    );

    const snapshot = await getDocs(ticketsQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async getSecurityAlerts(status?: 'pending' | 'reviewed' | 'resolved'): Promise<SecurityAlert[]> {
    let alertsQuery = query(collection(db, 'security_alerts'));

    if (status) {
      alertsQuery = query(alertsQuery, where('status', '==', status));
    }

    const snapshot = await getDocs(alertsQuery);
    return snapshot.docs.map((doc) => doc.data() as SecurityAlert);
  }

  static async updateAlertStatus(
    alertId: string,
    status: 'pending' | 'reviewed' | 'resolved',
    notes?: string
  ): Promise<void> {
    const alertRef = doc(db, 'security_alerts', alertId);
    await updateDoc(alertRef, {
      status,
      reviewedAt: serverTimestamp(),
      reviewNotes: notes || '',
    });

    console.log(`[SECURITY ALERT] ✅ Alert ${alertId} updated to status: ${status}`);
  }
}

export default TripCancellationManager;
