import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Users, Zap, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';
import { mockPayouts, mockEvents, mockStats } from '../lib/mockData';
import type { PayoutRequest, FinancialTransaction, Event } from '../types';

export default function AdminFinancePage() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    platformCommission: 0,
    payoutFees: 0,
    organizerPayouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[MOCK DATA] Loading admin finance...');

      setPayouts(mockPayouts as any);
      setTransactions([]);
      setPendingEvents(mockEvents.filter(e => e.status === 'draft') as Event[]);

      const totalSales = mockStats.totalRevenue;
      const platformCommission = totalSales * 0.05;
      const payoutFees = mockStats.pendingPayouts * 0.015;
      const organizerPayouts = 0;

      setStats({ totalSales, platformCommission, payoutFees, organizerPayouts });
      console.log('[MOCK DATA] Loaded admin finance data');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterGo = async (eventId: string) => {
    if (!confirm('Approuver cet événement et le débloquer pour les opérations ?')) {
      return;
    }

    setProcessing(true);
    try {
      console.log('[MOCK] Approving event:', eventId);
      setTimeout(() => {
        alert('Événement approuvé avec succès! (Mode Test)');
        setSelectedEvent(null);
        loadData();
        setProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error approving event:', error);
      setProcessing(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    setProcessing(true);
    try {
      console.log('[MOCK] Approving payout:', payoutId);
      setTimeout(() => {
        alert('Payout approuvé avec succès! (Mode Test)');
        setSelectedPayout(null);
        loadData();
        setProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error approving payout:', error);
      alert('Erreur lors de l\'approbation');
      setProcessing(false);
    }
  };

  const handleReject = async (payoutId: string, reason: string) => {
    if (!reason) {
      alert('Veuillez fournir une raison');
      return;
    }

    setProcessing(true);
    try {
      console.log('[MOCK] Rejecting payout:', payoutId, reason);
      setTimeout(() => {
        alert('Payout rejeté! (Mode Test)');
        setSelectedPayout(null);
        loadData();
        setProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error rejecting payout:', error);
      alert('Erreur lors du rejet');
      setProcessing(false);
    }
  };

  const handleOldReject = async (payoutId: string, reason: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', payoutId);

      if (error) throw error;
      alert('Payout rejeté');
      setSelectedPayout(null);
      loadData();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      alert('Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (payoutId: string, transactionRef: string) => {
    if (!transactionRef) {
      alert('Veuillez fournir une référence de transaction');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'completed',
          transaction_reference: transactionRef,
          processed_at: new Date().toISOString(),
        })
        .eq('id', payoutId);

      if (error) throw error;
      alert('Payout marqué comme complété');
      setSelectedPayout(null);
      loadData();
    } catch (error) {
      console.error('Error completing payout:', error);
      alert('Erreur lors de la complétion');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Admin Finance</h1>
          <p className="text-slate-400 mt-1">Gestion des flux financiers 5% / 1.5% / 93.5%</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {pendingEvents.length > 0 && (
          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-2 border-orange-500 rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-6">
              <Zap className="w-8 h-8 text-orange-400 mr-3" />
              <div>
                <h2 className="text-2xl font-black text-white">Événements en attente de validation</h2>
                <p className="text-orange-200 text-sm">Utilisez "Master GO" pour débloquer les opérations logistiques</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden hover:border-orange-500 transition-all cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="relative h-32 bg-slate-800">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded-full animate-pulse">
                      PENDING
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold mb-2 line-clamp-1">{event.title}</h3>
                    <div className="space-y-1 text-sm text-slate-400 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2" />
                        {new Date(event.start_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        {event.venue_city}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMasterGo(event.id);
                      }}
                      disabled={processing}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-black transition-all disabled:opacity-50 shadow-lg shadow-green-500/30 flex items-center justify-center"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      MASTER GO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-sm opacity-90">100%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalSales.toLocaleString()} FCFA</p>
            <p className="text-sm opacity-75">Ventes Totales</p>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" />
              <span className="text-sm opacity-90">5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.platformCommission.toLocaleString()} FCFA</p>
            <p className="text-sm opacity-75">Commission EvenPass</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
              <span className="text-sm opacity-90">1.5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.payoutFees.toLocaleString()} FCFA</p>
            <p className="text-sm opacity-75">Frais Techniques Payouts</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8" />
              <span className="text-sm opacity-90">93.5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.organizerPayouts.toLocaleString()} FCFA</p>
            <p className="text-sm opacity-75">Versé aux Organisateurs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Demandes de Payout</h2>

            <div className="space-y-4">
              {payouts.filter(p => p.status === 'pending' || p.status === 'approved').map((payout) => (
                <div
                  key={payout.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 cursor-pointer hover:border-orange-500 transition-colors"
                  onClick={() => setSelectedPayout(payout)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-white">{payout.request_number}</p>
                      <p className="text-sm text-slate-400">{(payout as any).organizer?.organization_name}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        payout.status === 'pending' ? 'bg-yellow-600' : 'bg-blue-600'
                      } text-white`}
                    >
                      {payout.status === 'pending' ? 'En attente' : 'Approuvé'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-slate-400">Demandé</p>
                      <p className="text-white font-medium">{payout.amount_requested.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Frais 1.5%</p>
                      <p className="text-yellow-400 font-medium">-{payout.technical_fees.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Net</p>
                      <p className="text-green-400 font-bold">{payout.net_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Transactions Récentes</h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {transactions.slice(0, 20).map((transaction) => (
                <div key={transaction.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {transaction.transaction_type === 'ticket_sale' && '🎟️ Vente de billet'}
                        {transaction.transaction_type === 'commission' && '💰 Commission (5%)'}
                        {transaction.transaction_type === 'payout_fee' && '📤 Frais payout (1.5%)'}
                        {transaction.transaction_type === 'organizer_payout' && '✅ Payout organisateur'}
                        {transaction.transaction_type === 'refund' && '↩️ Remboursement'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(transaction.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        transaction.transaction_type === 'commission' || transaction.transaction_type === 'payout_fee'
                          ? 'text-orange-400'
                          : transaction.transaction_type === 'organizer_payout'
                          ? 'text-green-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {transaction.amount.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedPayout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Détails du Payout</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Numéro</p>
                  <p className="text-white font-bold">{selectedPayout.request_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Organisateur</p>
                  <p className="text-white font-medium">{(selectedPayout as any).organizer?.organization_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white">{(selectedPayout as any).organizer?.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Téléphone</p>
                  <p className="text-white">{(selectedPayout as any).organizer?.contact_phone}</p>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant demandé (95%):</span>
                  <span className="text-white font-bold">{selectedPayout.amount_requested.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frais techniques (1.5%):</span>
                  <span className="text-yellow-400 font-bold">-{selectedPayout.technical_fees.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between border-t border-slate-600 pt-2">
                  <span className="text-green-300 font-bold">Net à verser (93.5%):</span>
                  <span className="text-green-400 font-bold text-xl">{selectedPayout.net_amount.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Méthode de paiement</p>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-slate-700 rounded-lg text-white font-medium">
                    {selectedPayout.payment_method === 'wave' ? 'Wave' : 'Orange Money'}
                  </span>
                  <span className="text-slate-300">
                    {(selectedPayout.payment_details as any)?.phone}
                  </span>
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
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPayout.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
                  >
                    Approuver
                  </button>
                </div>
              )}

              {selectedPayout.status === 'approved' && (
                <button
                  onClick={() => {
                    const ref = prompt('Référence de transaction:');
                    if (ref) handleComplete(selectedPayout.id, ref);
                  }}
                  disabled={processing}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
                >
                  Marquer comme complété
                </button>
              )}

              <button
                onClick={() => setSelectedPayout(null)}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
