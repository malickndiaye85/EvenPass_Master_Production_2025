import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Wallet, ArrowUpCircle, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';
import { mockEvents, mockStats, mockPayouts } from '../lib/mockData';
import type { OrganizerBalance, PayoutRequest, Event } from '../types';

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<OrganizerBalance | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'wave' | 'orange_money'>('wave');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      console.log('[MOCK DATA] Loading organizer dashboard...');

      const mockBalance: OrganizerBalance = {
        id: '1',
        organizer_id: '1',
        available_balance: mockStats.totalRevenue - mockStats.pendingPayouts,
        pending_balance: mockStats.pendingPayouts,
        total_earnings: mockStats.totalRevenue,
        total_paid_out: 0,
        currency: 'XOF',
        last_payout_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_sales: mockStats.totalRevenue,
        platform_commission: mockStats.totalRevenue * 0.05,
        pending_payouts: mockStats.pendingPayouts,
      };

      setBalance(mockBalance);
      setPayouts(mockPayouts as PayoutRequest[]);
      setEvents(mockEvents.filter(e => e.organizer_id === '1') as Event[]);
      console.log('[MOCK DATA] Loaded organizer data');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!user?.organizer || !balance) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance.available_balance) {
      alert('Montant invalide');
      return;
    }

    setProcessing(true);
    try {
      console.log('[MOCK] Creating payout request:', { amount, method: payoutMethod, phone: payoutPhone });

      setTimeout(() => {
        alert('Demande de payout créée avec succès! (Mode Test)');
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutPhone('');
        loadData();
        setProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating payout:', error);
      alert('Erreur lors de la création de la demande');
      setProcessing(false);
    }
  };

  const calculateNetAmount = () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount)) return 0;
    const technicalFees = amount * 0.015;
    return amount - technicalFees;
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
          <h1 className="text-3xl font-bold text-white">Dashboard Organisateur</h1>
          <p className="text-slate-400 mt-1">{user?.organizer?.organization_name}</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8" />
              <span className="text-sm opacity-90">Disponible</span>
            </div>
            <p className="text-3xl font-bold mb-1">
              {balance?.available_balance.toLocaleString() || '0'} FCFA
            </p>
            <p className="text-sm opacity-75">95% après commission (5%)</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-sm opacity-90">Ventes totales</span>
            </div>
            <p className="text-3xl font-bold mb-1">
              {balance?.total_sales.toLocaleString() || '0'} FCFA
            </p>
            <p className="text-sm opacity-75">Toutes ventes</p>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" />
              <span className="text-sm opacity-90">Commission</span>
            </div>
            <p className="text-3xl font-bold mb-1">
              {balance?.platform_commission.toLocaleString() || '0'} FCFA
            </p>
            <p className="text-sm opacity-75">5% EvenPass</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <span className="text-sm opacity-90">Événements</span>
            </div>
            <p className="text-3xl font-bold mb-1">{events.length}</p>
            <p className="text-sm opacity-75">Total créés</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Historique des Payouts</h2>
              </div>

              {payouts.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Aucune demande de payout</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-white">{payout.request_number}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(payout.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            payout.status === 'completed'
                              ? 'bg-green-600 text-white'
                              : payout.status === 'pending'
                              ? 'bg-yellow-600 text-white'
                              : payout.status === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {payout.status === 'completed' && 'Complété'}
                          {payout.status === 'pending' && 'En attente'}
                          {payout.status === 'rejected' && 'Rejeté'}
                          {payout.status === 'processing' && 'En cours'}
                          {payout.status === 'approved' && 'Approuvé'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Montant demandé</p>
                          <p className="text-white font-medium">{payout.amount_requested.toLocaleString()} FCFA</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Frais techniques (1.5%)</p>
                          <p className="text-yellow-400 font-medium">-{payout.technical_fees.toLocaleString()} FCFA</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Net reçu (93.5%)</p>
                          <p className="text-green-400 font-bold">{payout.net_amount.toLocaleString()} FCFA</p>
                        </div>
                      </div>

                      {payout.rejection_reason && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                          Raison du rejet: {payout.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <ArrowUpCircle className="w-6 h-6 mr-2 text-green-500" />
                Demander un Payout
              </h2>

              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Solde disponible:</span>
                    <span className="text-green-400 font-bold">
                      {balance?.available_balance.toLocaleString() || '0'} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">En attente:</span>
                    <span className="text-yellow-400 font-medium">
                      {balance?.pending_payouts.toLocaleString() || '0'} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total payé:</span>
                    <span className="text-slate-300">
                      {balance?.total_paid_out.toLocaleString() || '0'} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-blue-300 mb-2">Logique Financière</h3>
                <div className="space-y-2 text-xs text-blue-200/80">
                  <div className="flex justify-between">
                    <span>Commission EvenPass:</span>
                    <span className="font-bold">5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vous recevez (gross):</span>
                    <span className="font-bold">95%</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-500/20 pt-2">
                    <span>Frais payout:</span>
                    <span className="font-bold">1.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net final:</span>
                    <span className="font-bold text-green-300">93.5%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={!balance || balance.available_balance <= 0}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nouvelle demande
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Demande de Payout</h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Montant à retirer (max: {balance?.available_balance.toLocaleString()} FCFA)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Montant en FCFA"
                  disabled={processing}
                />
              </div>

              {payoutAmount && parseFloat(payoutAmount) > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Montant demandé:</span>
                    <span className="text-white font-medium">{parseFloat(payoutAmount).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frais techniques (1.5%):</span>
                    <span className="text-yellow-400 font-medium">
                      -{(parseFloat(payoutAmount) * 0.015).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-600 pt-2">
                    <span className="text-slate-300 font-bold">Vous recevrez:</span>
                    <span className="text-green-400 font-bold text-lg">
                      {calculateNetAmount().toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Méthode de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPayoutMethod('wave')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      payoutMethod === 'wave'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-white font-bold">Wave</div>
                  </button>
                  <button
                    onClick={() => setPayoutMethod('orange_money')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      payoutMethod === 'orange_money'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-white font-bold">Orange Money</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="77 123 45 67"
                  disabled={processing}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequestPayout}
                  disabled={processing || !payoutAmount || !payoutPhone || parseFloat(payoutAmount) <= 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
