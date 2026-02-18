import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Wallet, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../firebase';
import { securityLogger } from '../../lib/securityLogger';

interface Trip {
  id: string;
  driver_name: string;
  driver_email: string;
  departure: string;
  destination: string;
  total_revenue: number;
  commission_demdem: number;
  driver_share: number;
  status: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  driver_name: string;
  driver_email: string;
  driver_phone: string;
  amount: number;
  payment_method: 'wave' | 'orange_money';
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

const AdminFinanceVoyagePage: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (!db) return;

    const tripsRef = ref(db, 'trips');
    const withdrawalsRef = ref(db, 'withdrawal_requests');

    const unsubTrips = onValue(tripsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tripsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTrips(tripsArray);
      } else {
        setTrips([]);
      }
      setLoading(false);
    });

    const unsubWithdrawals = onValue(withdrawalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const withdrawalsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setWithdrawalRequests(withdrawalsArray);
      } else {
        setWithdrawalRequests([]);
      }
    });

    return () => {
      unsubTrips();
      unsubWithdrawals();
    };
  }, []);

  const handleApproveWithdrawal = async (requestId: string, driverEmail: string, amount: number) => {
    if (!db || !user) return;

    try {
      await update(ref(db, `withdrawal_requests/${requestId}`), {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.email
      });

      if (user.email && user.id && user.role) {
        await securityLogger.log({
          event_type: 'finance_access',
          user_email: user.email,
          user_id: user.id,
          user_role: user.role,
          action: `Withdrawal approved for ${driverEmail}: ${amount} F`,
          success: true,
          metadata: { request_id: requestId, driver_email: driverEmail, amount }
        });
      }

      alert('Retrait approuvé avec succès');
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleRejectWithdrawal = async (requestId: string, driverEmail: string) => {
    const reason = prompt('Raison du rejet:');
    if (!reason || !db || !user) return;

    try {
      await update(ref(db, `withdrawal_requests/${requestId}`), {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.email,
        rejection_reason: reason
      });

      if (user.email && user.id && user.role) {
        await securityLogger.log({
          event_type: 'finance_access',
          user_email: user.email,
          user_id: user.id,
          user_role: user.role,
          action: `Withdrawal rejected for ${driverEmail}`,
          success: true,
          metadata: { request_id: requestId, driver_email: driverEmail, reason }
        });
      }

      alert('Retrait rejeté');
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Erreur lors du rejet');
    }
  };

  const totalRevenue = trips.reduce((sum, t) => sum + (t.total_revenue || 0), 0);
  const totalCommission = trips.reduce((sum, t) => sum + (t.commission_demdem || 0), 0);
  const escrowAmount = trips.reduce((sum, t) => sum + (t.driver_share || 0), 0);
  const pendingWithdrawals = withdrawalRequests.filter(r => r.status === 'pending').length;

  const filteredWithdrawals = withdrawalRequests.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#FBBF24] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Finance Voyage</h1>
          <p className="text-blue-100">Flux financiers et validation des retraits</p>
          <div className="mt-2 inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <span className="text-blue-100 text-sm">Silo: <span className="font-bold text-white">VOYAGE</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-green-300" size={24} />
              <span className="text-2xl font-bold text-white">{totalRevenue.toLocaleString()} F</span>
            </div>
            <p className="text-blue-100 text-sm">CA Total Trajets</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-yellow-300" size={24} />
              <span className="text-2xl font-bold text-white">{totalCommission.toLocaleString()} F</span>
            </div>
            <p className="text-blue-100 text-sm">Commission (5%)</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="text-blue-300" size={24} />
              <span className="text-2xl font-bold text-white">{escrowAmount.toLocaleString()} F</span>
            </div>
            <p className="text-blue-100 text-sm">Montant en séquestre</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-orange-300" size={24} />
              <span className="text-2xl font-bold text-white">{pendingWithdrawals}</span>
            </div>
            <p className="text-blue-100 text-sm">Retraits en attente</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Wallet className="mr-3" size={28} />
                Retraits Wave
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  En attente
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'approved'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Approuvés
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Rejetés
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="p-12 text-center text-blue-200">
                Aucune demande de retrait à afficher
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Chauffeur</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Téléphone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Montant</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Méthode</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Date demande</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredWithdrawals.map((request) => (
                    <tr key={request.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{request.driver_name}</div>
                        <div className="text-blue-200 text-sm">{request.driver_email}</div>
                      </td>
                      <td className="px-6 py-4 text-white">{request.driver_phone}</td>
                      <td className="px-6 py-4 text-yellow-300 font-bold text-lg">{request.amount.toLocaleString()} F</td>
                      <td className="px-6 py-4">
                        {request.payment_method === 'wave' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Wave
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            Orange Money
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-blue-200 text-sm">
                        {new Date(request.requested_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            <Clock size={14} className="mr-1" />
                            En attente
                          </span>
                        )}
                        {request.status === 'approved' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                            <CheckCircle size={14} className="mr-1" />
                            Approuvé
                          </span>
                        )}
                        {request.status === 'rejected' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                            <XCircle size={14} className="mr-1" />
                            Rejeté
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveWithdrawal(request.id, request.driver_email, request.amount)}
                              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                              title="Approuver"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(request.id, request.driver_email)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Rejeter"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinanceVoyagePage;
