import { useState, useEffect } from 'react';
import { CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/FirebaseAuthContext';

interface PayoutRequest {
  id: string;
  organizer_id: string;
  organizer_name: string;
  request_number: string;
  amount_requested: number;
  technical_fees: number;
  net_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_details: { phone: string };
  requested_at: any;
  processed_at?: any;
  marked_received_at?: any;
}

export default function AdminPayoutManager() {
  const { firebaseUser } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const payoutsRef = collection(firestore, 'payout_requests');
    const payoutsQuery = query(
      payoutsRef,
      where('status', 'in', ['pending', 'approved', 'completed'])
    );

    const unsubscribe = onSnapshot(payoutsQuery, (snapshot) => {
      const loadedPayouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PayoutRequest[];

      loadedPayouts.sort((a, b) => {
        const dateA = a.requested_at?.toDate?.() || new Date(0);
        const dateB = b.requested_at?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setPayouts(loadedPayouts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsReceived = async (payoutId: string) => {
    if (!confirm('✅ Confirmer que ce paiement a été reçu par l\'organisateur ?')) {
      return;
    }

    setProcessing(true);

    try {
      const payoutRef = doc(firestore, 'payout_requests', payoutId);
      await updateDoc(payoutRef, {
        marked_received_at: Timestamp.now(),
        marked_received_by: firebaseUser?.uid || '',
        status: 'completed',
      });

      alert('✅ Paiement marqué comme reçu !');
      setSelectedPayout(null);
    } catch (error) {
      console.error('[ADMIN PAYOUT] Error marking as received:', error);
      alert('❌ Erreur lors du marquage');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    if (!confirm('✅ Approuver ce payout ?')) {
      return;
    }

    setProcessing(true);

    try {
      const payoutRef = doc(firestore, 'payout_requests', payoutId);
      await updateDoc(payoutRef, {
        status: 'approved',
        processed_at: Timestamp.now(),
        processed_by: firebaseUser?.uid || '',
      });

      alert('✅ Payout approuvé !');
      setSelectedPayout(null);
    } catch (error) {
      console.error('[ADMIN PAYOUT] Error approving:', error);
      alert('❌ Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (payoutId: string, reason: string) => {
    if (!reason) {
      alert('⚠️ Veuillez fournir une raison');
      return;
    }

    setProcessing(true);

    try {
      const payoutRef = doc(firestore, 'payout_requests', payoutId);
      await updateDoc(payoutRef, {
        status: 'rejected',
        rejection_reason: reason,
        processed_at: Timestamp.now(),
        processed_by: firebaseUser?.uid || '',
      });

      alert('❌ Payout rejeté !');
      setSelectedPayout(null);
    } catch (error) {
      console.error('[ADMIN PAYOUT] Error rejecting:', error);
      alert('❌ Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const formatAmount = (amount: number): string => {
    return Math.round(amount).toLocaleString('fr-FR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-600', icon: Clock, label: '⏳ En attente' };
      case 'approved':
        return { bg: 'bg-blue-600', icon: AlertCircle, label: '✅ Approuvé' };
      case 'completed':
        return { bg: 'bg-green-600', icon: CheckCircle, label: '✅ Reçu' };
      default:
        return { bg: 'bg-gray-600', icon: Clock, label: status };
    }
  };

  if (loading) {
    return (
      <div className="bg-[#2A2A2A] p-6 text-center" style={{ borderRadius: '40px 120px 40px 120px' }}>
        <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-sm">Chargement des payouts...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {payouts.length === 0 ? (
          <div className="bg-[#2A2A2A] border border-[#2A2A2A] p-8 text-center" style={{ borderRadius: '40px 120px 40px 120px' }}>
            <CheckCircle className="w-16 h-16 text-[#B5B5B5] mx-auto mb-4 opacity-50" />
            <p className="text-[#B5B5B5] font-bold">Aucun payout en cours</p>
          </div>
        ) : (
          payouts.map((payout) => {
            const statusBadge = getStatusBadge(payout.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={payout.id}
                className="bg-[#0F0F0F] p-4 border border-[#2A2A2A] cursor-pointer hover:border-[#FF5F05] transition-all"
                style={{ borderRadius: '20px 8px 20px 8px' }}
                onClick={() => setSelectedPayout(payout)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-white">{payout.request_number}</p>
                    <p className="text-sm text-[#B5B5B5]">{payout.organizer_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.bg} text-white flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[#B5B5B5]">Demandé</p>
                    <p className="text-white font-medium">{formatAmount(payout.amount_requested)} F</p>
                  </div>
                  <div>
                    <p className="text-[#B5B5B5]">Frais 1.5%</p>
                    <p className="text-yellow-400 font-medium">-{formatAmount(payout.technical_fees)} F</p>
                  </div>
                  <div>
                    <p className="text-[#B5B5B5]">Net</p>
                    <p className="text-green-400 font-bold">{formatAmount(payout.net_amount)} F</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedPayout && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] max-w-2xl w-full border border-[#2A2A2A]" style={{ borderRadius: '40px 120px 40px 120px' }}>
            <div className="p-6 border-b border-[#0F0F0F] flex justify-between items-center">
              <h2 className="text-2xl font-black text-white">💰 Détails du Payout</h2>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-[#B5B5B5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#B5B5B5]">Numéro</p>
                  <p className="text-white font-bold">{selectedPayout.request_number}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Organisateur</p>
                  <p className="text-white font-medium">{selectedPayout.organizer_name}</p>
                </div>
              </div>

              <div className="bg-[#0F0F0F] p-4 border border-[#2A2A2A] space-y-2" style={{ borderRadius: '20px 8px 20px 8px' }}>
                <div className="flex justify-between">
                  <span className="text-[#B5B5B5]">Montant demandé (95%):</span>
                  <span className="text-white font-bold">{formatAmount(selectedPayout.amount_requested)} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B5B5B5]">Frais techniques (1.5%):</span>
                  <span className="text-yellow-400 font-bold">-{formatAmount(selectedPayout.technical_fees)} F</span>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-2">
                  <span className="text-green-300 font-bold">Net à verser (93.5%):</span>
                  <span className="text-green-400 font-bold text-xl">{formatAmount(selectedPayout.net_amount)} F</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#B5B5B5] mb-2">Méthode de paiement</p>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#0F0F0F] rounded-lg text-white font-medium">
                    {selectedPayout.payment_method === 'wave' ? '💚 Wave' : '🟠 Orange Money'}
                  </span>
                  <span className="text-[#B5B5B5]">{selectedPayout.payment_details?.phone}</span>
                </div>
              </div>

              {selectedPayout.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du rejet:');
                      if (reason) handleReject(selectedPayout.id, reason);
                    }}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50"
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                  >
                    ❌ Rejeter
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPayout.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold transition-colors disabled:opacity-50"
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                  >
                    ✅ Approuver
                  </button>
                </div>
              )}

              {selectedPayout.status === 'approved' && (
                <button
                  onClick={() => handleMarkAsReceived(selectedPayout.id)}
                  disabled={processing}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  <CheckCircle className="w-5 h-5" />
                  Marquer comme Reçu
                </button>
              )}

              <button
                onClick={() => setSelectedPayout(null)}
                className="w-full px-6 py-3 bg-[#0F0F0F] hover:bg-[#2A2A2A] text-white font-bold transition-colors border border-[#2A2A2A]"
                style={{ borderRadius: '20px 8px 20px 8px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
