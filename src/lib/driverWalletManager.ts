import { firestore } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

export interface WalletTransaction {
  id: string;
  driverId: string;
  tripId: string;
  passengerId: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'available' | 'withdrawn' | 'cancelled';
  tripOrigin: string;
  tripDestination: string;
  scanDepartureAt?: Timestamp;
  scanArrivalAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WalletBalance {
  pending: number;
  available: number;
  withdrawn: number;
  total: number;
}

export interface WithdrawalRequest {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  amount: number;
  wavePhoneNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string;
  rejectionReason?: string;
}

export class DriverWalletManager {
  static async createTransaction(data: {
    driverId: string;
    tripId: string;
    passengerId: string;
    amount: number;
    tripOrigin: string;
    tripDestination: string;
  }): Promise<string> {
    try {
      const commission = data.amount * 0.05;
      const netAmount = data.amount * 0.95;

      const transactionRef = doc(collection(firestore, 'driver_transactions'));
      const transaction: Omit<WalletTransaction, 'id'> = {
        driverId: data.driverId,
        tripId: data.tripId,
        passengerId: data.passengerId,
        amount: data.amount,
        commission,
        netAmount,
        status: 'pending',
        tripOrigin: data.tripOrigin,
        tripDestination: data.tripDestination,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(transactionRef, transaction);

      console.log('[WALLET] ✅ Transaction créée:', transactionRef.id);
      return transactionRef.id;
    } catch (error) {
      console.error('[WALLET] ❌ Error creating transaction:', error);
      throw error;
    }
  }

  static async markTransactionAvailable(
    transactionId: string,
    scanArrivalTimestamp: Timestamp
  ): Promise<void> {
    try {
      const transactionRef = doc(firestore, 'driver_transactions', transactionId);
      await updateDoc(transactionRef, {
        status: 'available',
        scanArrivalAt: scanArrivalTimestamp,
        updatedAt: serverTimestamp(),
      });

      console.log('[WALLET] ✅ Transaction marquée disponible:', transactionId);
    } catch (error) {
      console.error('[WALLET] ❌ Error marking transaction available:', error);
      throw error;
    }
  }

  static async getWalletBalance(driverId: string): Promise<WalletBalance> {
    try {
      const transactionsRef = collection(firestore, 'driver_transactions');
      const q = query(transactionsRef, where('driverId', '==', driverId));
      const snapshot = await getDocs(q);

      const balance: WalletBalance = {
        pending: 0,
        available: 0,
        withdrawn: 0,
        total: 0,
      };

      snapshot.docs.forEach((doc) => {
        const transaction = doc.data() as WalletTransaction;

        switch (transaction.status) {
          case 'pending':
            balance.pending += transaction.netAmount;
            break;
          case 'available':
            balance.available += transaction.netAmount;
            break;
          case 'withdrawn':
            balance.withdrawn += transaction.netAmount;
            break;
        }
      });

      balance.total = balance.pending + balance.available + balance.withdrawn;

      console.log('[WALLET] 💰 Solde calculé:', balance);
      return balance;
    } catch (error) {
      console.error('[WALLET] ❌ Error calculating balance:', error);
      throw error;
    }
  }

  static async getTransactions(
    driverId: string,
    status?: 'pending' | 'available' | 'withdrawn' | 'cancelled'
  ): Promise<WalletTransaction[]> {
    try {
      const transactionsRef = collection(firestore, 'driver_transactions');
      let q = query(
        transactionsRef,
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      const transactions: WalletTransaction[] = [];

      snapshot.docs.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data(),
        } as WalletTransaction);
      });

      console.log('[WALLET] 📋 Transactions récupérées:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('[WALLET] ❌ Error fetching transactions:', error);
      throw error;
    }
  }

  static async requestWithdrawal(data: {
    driverId: string;
    driverName: string;
    driverPhone: string;
    amount: number;
    wavePhoneNumber: string;
  }): Promise<string> {
    try {
      const balance = await this.getWalletBalance(data.driverId);

      if (balance.available < data.amount) {
        throw new Error('Solde disponible insuffisant');
      }

      const withdrawalRef = doc(collection(firestore, 'withdrawal_requests'));
      const withdrawal: Omit<WithdrawalRequest, 'id'> = {
        driverId: data.driverId,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        amount: data.amount,
        wavePhoneNumber: data.wavePhoneNumber,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      await setDoc(withdrawalRef, withdrawal);

      const transactionsRef = collection(firestore, 'driver_transactions');
      const q = query(
        transactionsRef,
        where('driverId', '==', data.driverId),
        where('status', '==', 'available')
      );
      const snapshot = await getDocs(q);

      let remainingAmount = data.amount;
      const updatePromises: Promise<void>[] = [];

      for (const docSnap of snapshot.docs) {
        if (remainingAmount <= 0) break;

        const transaction = docSnap.data() as WalletTransaction;

        if (transaction.netAmount <= remainingAmount) {
          updatePromises.push(
            updateDoc(doc(firestore, 'driver_transactions', docSnap.id), {
              status: 'withdrawn',
              withdrawalRequestId: withdrawalRef.id,
              updatedAt: serverTimestamp(),
            })
          );
          remainingAmount -= transaction.netAmount;
        }
      }

      await Promise.all(updatePromises);

      await this.notifyOpsManagerWithdrawal(data.driverId, data.driverName, data.amount, withdrawalRef.id);

      console.log('[WALLET] ✅ Demande de retrait créée:', withdrawalRef.id);
      return withdrawalRef.id;
    } catch (error) {
      console.error('[WALLET] ❌ Error requesting withdrawal:', error);
      throw error;
    }
  }

  private static async notifyOpsManagerWithdrawal(
    driverId: string,
    driverName: string,
    amount: number,
    withdrawalId: string
  ): Promise<void> {
    try {
      const usersRef = collection(firestore, 'users');
      const opsQuery = query(usersRef, where('role', '==', 'ops_transport'));
      const opsSnapshot = await getDocs(opsQuery);

      const notificationPromises: Promise<void>[] = [];

      opsSnapshot.docs.forEach((opsDoc) => {
        const notificationRef = doc(collection(firestore, 'notifications'));
        notificationPromises.push(
          setDoc(notificationRef, {
            userId: opsDoc.id,
            type: 'withdrawal_request',
            title: 'Demande de Retrait Wave',
            message: `${driverName} demande un retrait de ${amount.toLocaleString()} FCFA.`,
            driverId,
            withdrawalId,
            amount,
            priority: 'high',
            read: false,
            createdAt: serverTimestamp(),
          })
        );
      });

      await Promise.all(notificationPromises);

      console.log('[WALLET] ✅ Notifications Ops Manager envoyées');
    } catch (error) {
      console.error('[WALLET] ❌ Error notifying ops manager:', error);
    }
  }

  static async getWithdrawalRequests(
    driverId: string,
    status?: 'pending' | 'processing' | 'completed' | 'rejected'
  ): Promise<WithdrawalRequest[]> {
    try {
      const withdrawalsRef = collection(firestore, 'withdrawal_requests');
      let q = query(
        withdrawalsRef,
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      const withdrawals: WithdrawalRequest[] = [];

      snapshot.docs.forEach((doc) => {
        withdrawals.push({
          id: doc.id,
          ...doc.data(),
        } as WithdrawalRequest);
      });

      console.log('[WALLET] 📋 Demandes de retrait récupérées:', withdrawals.length);
      return withdrawals;
    } catch (error) {
      console.error('[WALLET] ❌ Error fetching withdrawal requests:', error);
      throw error;
    }
  }

  static async cancelWithdrawalRequest(withdrawalId: string): Promise<void> {
    try {
      const withdrawalRef = doc(firestore, 'withdrawal_requests', withdrawalId);
      await updateDoc(withdrawalRef, {
        status: 'rejected',
        rejectionReason: 'Annulé par le chauffeur',
        updatedAt: serverTimestamp(),
      });

      const transactionsRef = collection(firestore, 'driver_transactions');
      const q = query(
        transactionsRef,
        where('withdrawalRequestId', '==', withdrawalId),
        where('status', '==', 'withdrawn')
      );
      const snapshot = await getDocs(q);

      const updatePromises = snapshot.docs.map((docSnap) =>
        updateDoc(doc(firestore, 'driver_transactions', docSnap.id), {
          status: 'available',
          withdrawalRequestId: null,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);

      console.log('[WALLET] ✅ Demande de retrait annulée:', withdrawalId);
    } catch (error) {
      console.error('[WALLET] ❌ Error cancelling withdrawal:', error);
      throw error;
    }
  }
}

export default DriverWalletManager;
