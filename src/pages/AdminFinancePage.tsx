import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CheckCircle, Users, Zap, Calendar, MapPin, X } from 'lucide-react';
import { mockPayouts, mockEvents, mockStats } from '../lib/mockData';

interface PayoutRequest {
  id: string;
  organizer_id: string;
  request_number: string;
  amount_requested: number;
  technical_fees: number;
  net_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_details: { phone: string };
  requested_at: string;
  created_at: string;
  organizer: {
    id: string;
    organization_name: string;
    contact_email: string;
    contact_phone: string;
  };
}

interface Event {
  id: string;
  title: string;
  start_date: string;
  venue_city: string;
  status: string;
  event_image_url?: string;
}

export default function AdminFinancePage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    platformCommission: 0,
    payoutFees: 0,
    organizerPayouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      console.log('[MOCK DATA] Loading admin finance...');

      setPayouts(mockPayouts as any);
      setPendingEvents(mockEvents.filter(e => e.status === 'draft') as Event[]);

      const totalSales = mockStats.totalRevenue || 0;
      const platformCommission = totalSales * 0.05;
      const payoutFees = mockStats.pendingPayouts * 0.015;
      const organizerPayouts = totalSales * 0.935;

      setStats({ totalSales, platformCommission, payoutFees, organizerPayouts });
      console.log('[MOCK DATA] Loaded admin finance data');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterGo = (eventId: string) => {
    if (!confirm('Approuver cet événement et le débloquer pour les opérations ?')) {
      return;
    }

    setProcessing(true);
    console.log('[MOCK] Approving event:', eventId);
    setTimeout(() => {
      alert('✅ Événement approuvé avec succès! (Mode Test)');
      loadData();
      setProcessing(false);
    }, 800);
  };

  const handleApprove = (payoutId: string) => {
    setProcessing(true);
    console.log('[MOCK] Approving payout:', payoutId);
    setTimeout(() => {
      alert('✅ Payout approuvé avec succès! (Mode Test)');
      setSelectedPayout(null);
      loadData();
      setProcessing(false);
    }, 800);
  };

  const handleReject = (payoutId: string, reason: string) => {
    if (!reason) {
      alert('⚠️ Veuillez fournir une raison');
      return;
    }

    setProcessing(true);
    console.log('[MOCK] Rejecting payout:', payoutId, reason);
    setTimeout(() => {
      alert('❌ Payout rejeté! (Mode Test)');
      setSelectedPayout(null);
      loadData();
      setProcessing(false);
    }, 800);
  };

  const formatAmount = (amount: number | undefined): string => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0';
    return Math.round(amount).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <header className="bg-[#0A0A0B] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">💰 Admin Finance</h1>
          <p className="text-[#B5B5B5] mt-1">Gestion des flux financiers 5% / 1.5% / 93.5%</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {pendingEvents.length > 0 && (
          <div className="bg-gradient-to-br from-[#FF5F05]/20 to-red-900/20 border-2 border-[#FF5F05] rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-6">
              <Zap className="w-8 h-8 text-[#FF5F05] mr-3" />
              <div>
                <h2 className="text-2xl font-black text-white">⚡ Événements en attente de validation</h2>
                <p className="text-[#FF5F05] text-sm">Utilisez "Master GO" pour débloquer les opérations logistiques</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#2A2A2A] rounded-xl border border-[#2A2A2A] overflow-hidden hover:border-[#FF5F05] transition-all cursor-pointer"
                >
                  <div className="relative h-32 bg-[#0F0F0F]">
                    {event.event_image_url ? (
                      <img
                        src={event.event_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-[#B5B5B5]" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded-full animate-pulse">
                      PENDING
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold mb-2 line-clamp-1">{event.title}</h3>
                    <div className="space-y-1 text-sm text-[#B5B5B5] mb-3">
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
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-sm opacity-90 font-bold">100%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatAmount(stats.totalSales)} FCFA</p>
            <p className="text-sm opacity-75">Ventes Totales</p>
          </div>

          <div className="bg-gradient-to-br from-[#FF5F05] to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" />
              <span className="text-sm opacity-90 font-bold">5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatAmount(stats.platformCommission)} FCFA</p>
            <p className="text-sm opacity-75">Commission EvenPass</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
              <span className="text-sm opacity-90 font-bold">1.5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatAmount(stats.payoutFees)} FCFA</p>
            <p className="text-sm opacity-75">Frais Techniques Payouts</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8" />
              <span className="text-sm opacity-90 font-bold">93.5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatAmount(stats.organizerPayouts)} FCFA</p>
            <p className="text-sm opacity-75">Versé aux Organisateurs</p>
          </div>
        </div>

        <div className="bg-[#2A2A2A] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-xl font-bold text-white mb-6">📋 Demandes de Payout</h2>

          <div className="space-y-4">
            {payouts.filter(p => p.status === 'pending' || p.status === 'approved').map((payout) => (
              <div
                key={payout.id}
                className="bg-[#0F0F0F] rounded-lg p-4 border border-[#2A2A2A] cursor-pointer hover:border-[#FF5F05] transition-colors"
                onClick={() => setSelectedPayout(payout)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-white">{payout.request_number}</p>
                    <p className="text-sm text-[#B5B5B5]">{payout.organizer?.organization_name}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      payout.status === 'pending' ? 'bg-yellow-600' : 'bg-blue-600'
                    } text-white`}
                  >
                    {payout.status === 'pending' ? '⏳ En attente' : '✅ Approuvé'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[#B5B5B5]">Demandé</p>
                    <p className="text-white font-medium">{formatAmount(payout.amount_requested)}</p>
                  </div>
                  <div>
                    <p className="text-[#B5B5B5]">Frais 1.5%</p>
                    <p className="text-yellow-400 font-medium">-{formatAmount(payout.technical_fees)}</p>
                  </div>
                  <div>
                    <p className="text-[#B5B5B5]">Net</p>
                    <p className="text-green-400 font-bold">{formatAmount(payout.net_amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPayout && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] rounded-2xl max-w-2xl w-full border border-[#2A2A2A]">
            <div className="p-6 border-b border-[#0F0F0F] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">💰 Détails du Payout</h2>
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
                  <p className="text-white font-medium">{selectedPayout.organizer?.organization_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Email</p>
                  <p className="text-white">{selectedPayout.organizer?.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Téléphone</p>
                  <p className="text-white">{selectedPayout.organizer?.contact_phone}</p>
                </div>
              </div>

              <div className="bg-[#0F0F0F] rounded-lg p-4 border border-[#2A2A2A] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#B5B5B5]">Montant demandé (95%):</span>
                  <span className="text-white font-bold">{formatAmount(selectedPayout.amount_requested)} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B5B5B5]">Frais techniques (1.5%):</span>
                  <span className="text-yellow-400 font-bold">-{formatAmount(selectedPayout.technical_fees)} FCFA</span>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-2">
                  <span className="text-green-300 font-bold">Net à verser (93.5%):</span>
                  <span className="text-green-400 font-bold text-xl">{formatAmount(selectedPayout.net_amount)} FCFA</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#B5B5B5] mb-2">Méthode de paiement</p>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#0F0F0F] rounded-lg text-white font-medium">
                    {selectedPayout.payment_method === 'wave' ? '💚 Wave' : '🟠 Orange Money'}
                  </span>
                  <span className="text-[#B5B5B5]">
                    {selectedPayout.payment_details?.phone}
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
                    ❌ Rejeter
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPayout.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
                  >
                    ✅ Approuver
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedPayout(null)}
                className="w-full px-6 py-3 bg-[#0F0F0F] hover:bg-[#2A2A2A] text-white rounded-lg transition-colors border border-[#2A2A2A]"
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
