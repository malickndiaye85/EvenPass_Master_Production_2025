import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, CheckCircle, Users, Zap, Calendar, MapPin, X, Clock, LogOut, Package, Plus, Loader } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { mockPayouts, mockEvents, mockStats } from '../lib/mockData';
import OrganizerVerificationTab from '../components/OrganizerVerificationTab';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';

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
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, firebaseUser } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
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
  const [activeTab, setActiveTab] = useState<'payouts' | 'events' | 'verification'>('payouts');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [organizerEvents, setOrganizerEvents] = useState<any[]>([]);
  const [bulkForm, setBulkForm] = useState({
    organizer_id: '',
    event_id: '',
    quantity: '',
    unit_price: '',
  });
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    console.log('[ADMIN FINANCE] Auth state:', {
      authLoading,
      user: user?.email,
      role: user?.role,
      uid: firebaseUser?.uid
    });

    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        console.log('[ADMIN FINANCE] Access denied, redirecting to home');
        navigate('/');
      } else {
        console.log('[ADMIN FINANCE] Access granted, loading data');
        loadData();
      }
    }
  }, [authLoading, user, navigate]);

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
      navigate('/admin/finance/login');
    }
  };

  const loadData = async () => {
    try {
      console.log('[MOCK DATA] Loading admin finance...', { userRole: user?.role, uid: firebaseUser?.uid });

      setPayouts(mockPayouts as any);
      setPendingEvents(mockEvents.filter(e => e.status === 'draft') as Event[]);
      setAllEvents(mockEvents as Event[]);

      const totalSales = mockStats.totalRevenue || 0;
      const platformCommission = totalSales * 0.05;
      const payoutFees = mockStats.pendingPayouts * 0.015;
      const organizerPayouts = totalSales * 0.935;

      setStats({ totalSales, platformCommission, payoutFees, organizerPayouts });

      const organizersRef = collection(firestore, 'organizers');
      const organizersQuery = query(organizersRef, where('verification_status', '==', 'verified'));
      const organizersSnapshot = await getDocs(organizersQuery);
      const loadedOrganizers = organizersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrganizers(loadedOrganizers);

      console.log('[MOCK DATA] Loaded admin finance data successfully');
    } catch (error) {
      console.error('[ADMIN FINANCE] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizerEvents = async (organizerId: string) => {
    try {
      const eventsRef = collection(firestore, 'events');
      const eventsQuery = query(eventsRef, where('organizer_id', '==', organizerId), where('status', '==', 'published'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const loadedEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrganizerEvents(loadedEvents);
    } catch (error) {
      console.error('[ADMIN FINANCE] Error loading organizer events:', error);
    }
  };

  const handleCreateBulk = async () => {
    if (!bulkForm.organizer_id || !bulkForm.event_id || !bulkForm.quantity || !bulkForm.unit_price) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }

    const quantity = parseInt(bulkForm.quantity);
    const unitPrice = parseInt(bulkForm.unit_price);

    if (quantity <= 0 || unitPrice <= 0) {
      alert('⚠️ Les valeurs doivent être supérieures à 0');
      return;
    }

    if (!confirm(`✅ Confirmer la création de ${quantity} billets à ${unitPrice.toLocaleString()} FCFA ?`)) {
      return;
    }

    setBulkProcessing(true);
    setBulkProgress(20);

    try {
      const selectedOrganizer = organizers.find(o => o.id === bulkForm.organizer_id);
      const selectedEvent = organizerEvents.find(e => e.id === bulkForm.event_id);

      setBulkProgress(40);

      const bulkSaleData = {
        organizer_id: bulkForm.organizer_id,
        organizer_name: selectedOrganizer?.organization_name || '',
        event_id: bulkForm.event_id,
        event_title: selectedEvent?.title || '',
        quantity_allocated: quantity,
        quantity_sold: 0,
        unit_price: unitPrice,
        total_value: quantity * unitPrice,
        created_at: Timestamp.now(),
        created_by: firebaseUser?.uid || '',
        status: 'active',
      };

      setBulkProgress(60);

      await addDoc(collection(firestore, 'bulk_sales'), bulkSaleData);

      setBulkProgress(80);

      const transactionData = {
        type: 'bulk_generation',
        organizer_id: bulkForm.organizer_id,
        event_id: bulkForm.event_id,
        quantity: quantity,
        unit_price: unitPrice,
        total_amount: quantity * unitPrice,
        created_at: Timestamp.now(),
        created_by: firebaseUser?.uid || '',
        status: 'confirmed',
      };

      await addDoc(collection(firestore, 'transactions'), transactionData);

      setBulkProgress(100);

      setTimeout(() => {
        alert(`✅ Bloc de ${quantity} billets créé avec succès!\n\nOrganisateur : ${selectedOrganizer?.organization_name}\nÉvénement : ${selectedEvent?.title}\nValeur totale : ${(quantity * unitPrice).toLocaleString()} FCFA`);
        setShowBulkModal(false);
        setBulkForm({ organizer_id: '', event_id: '', quantity: '', unit_price: '' });
        setBulkProgress(0);
        setBulkProcessing(false);
      }, 500);

    } catch (error) {
      console.error('[ADMIN FINANCE] Error creating bulk:', error);
      alert('❌ Erreur lors de la création du bloc');
      setBulkProcessing(false);
      setBulkProgress(0);
    }
  };

  const handleMasterGo = (eventId: string) => {
    if (!confirm('✅ Approuver cet événement et le débloquer pour les opérations ?')) {
      return;
    }

    setProcessing(true);
    console.log('[MOCK] Approving event:', eventId);
    setTimeout(() => {
      alert('✅ Événement approuvé avec succès! (Mode Test)');
      setSelectedEvent(null);
      loadData();
      setProcessing(false);
    }, 800);
  };

  const handleSuspendEvent = (eventId: string) => {
    if (!confirm('⚠️ Suspendre cet événement ? Les ventes seront bloquées.')) {
      return;
    }

    setProcessing(true);
    console.log('[MOCK] Suspending event:', eventId);
    setTimeout(() => {
      alert('⏸️ Événement suspendu! (Mode Test)');
      setSelectedEvent(null);
      loadData();
      setProcessing(false);
    }, 800);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!confirm('❌ ATTENTION : Supprimer définitivement cet événement ?')) {
      return;
    }

    setProcessing(true);
    console.log('[MOCK] Deleting event:', eventId);
    setTimeout(() => {
      alert('🗑️ Événement supprimé! (Mode Test)');
      setSelectedEvent(null);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF5F05] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <header className="bg-[#0A0A0B] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">💰 Admin Finance</h1>
            <p className="text-[#B5B5B5] mt-1">Gestion des flux financiers 5% / 1.5% / 93.5%</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
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
            <p className="text-sm opacity-75 mb-2">Ventes Totales</p>
            <div className="text-xs opacity-70 space-y-1 pt-2 border-t border-white/20">
              <div className="flex justify-between">
                <span>Web (OM/Wave):</span>
                <span className="font-semibold">{formatAmount(stats.totalSales * 0.7)} F</span>
              </div>
              <div className="flex justify-between">
                <span>Bloc Admin:</span>
                <span className="font-semibold">{formatAmount(stats.totalSales * 0.3)} F</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FF5F05] to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" />
              <span className="text-sm opacity-90 font-bold">5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatAmount(stats.platformCommission)} FCFA</p>
            <p className="text-sm opacity-75 mb-2">Commission EvenPass</p>
            <div className="text-xs opacity-70 pt-2 border-t border-white/20">
              <p>Sur Web + Bloc (100%)</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8" />
              <span className="text-sm opacity-90 font-bold">1.5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatAmount(stats.payoutFees)} FCFA</p>
            <p className="text-sm opacity-75 mb-2">Frais Passerelle</p>
            <div className="text-xs opacity-70 pt-2 border-t border-white/20">
              <p>Uniquement sur Ventes Web</p>
              <p className="text-[10px] mt-1">(Bloc = 0% frais)</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8" />
              <span className="text-sm opacity-90 font-bold">93.5%</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatAmount(stats.organizerPayouts)} FCFA</p>
            <p className="text-sm opacity-75 mb-2">Net Organisateurs</p>
            <div className="text-xs opacity-70 pt-2 border-t border-white/20">
              <p>Total - Commission - Frais</p>
            </div>
          </div>
        </div>

        <div className="bg-[#2A2A2A] rounded-xl border border-[#2A2A2A] p-6">
          <div className="flex justify-between items-center gap-4 mb-6 border-b border-[#0F0F0F]">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('payouts')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'payouts'
                    ? 'text-[#FF5F05] border-b-2 border-[#FF5F05]'
                    : 'text-[#B5B5B5] hover:text-white'
                }`}
              >
                📋 Payouts ({payouts.filter(p => p.status === 'pending' || p.status === 'approved').length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'events'
                    ? 'text-[#FF5F05] border-b-2 border-[#FF5F05]'
                    : 'text-[#B5B5B5] hover:text-white'
                }`}
              >
                🎫 Tous les Événements ({allEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'verification'
                    ? 'text-[#FF5F05] border-b-2 border-[#FF5F05]'
                    : 'text-[#B5B5B5] hover:text-white'
                }`}
              >
                ✅ Vérification Organisateurs
              </button>
            </div>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold transition-all shadow-lg flex items-center gap-2"
              style={{ borderRadius: '40px 8px 40px 8px' }}
            >
              <Package className="w-4 h-4" />
              Créer une Vente en Bloc
            </button>
          </div>

          {activeTab === 'payouts' && (
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
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              {allEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#0F0F0F] rounded-lg p-4 border border-[#2A2A2A] cursor-pointer hover:border-[#FF5F05] transition-colors"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-white">{event.title}</p>
                      <p className="text-sm text-[#B5B5B5]">{event.venue_city}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        event.status === 'published' ? 'bg-green-600' :
                        event.status === 'draft' ? 'bg-yellow-600' :
                        'bg-red-600'
                      } text-white`}
                    >
                      {event.status === 'published' && '✅ Publié'}
                      {event.status === 'draft' && '⏳ Brouillon'}
                      {event.status === 'suspended' && '⏸️ Suspendu'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[#B5B5B5]">Date</p>
                      <p className="text-white font-medium">
                        {new Date(event.start_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#B5B5B5]">Lieu</p>
                      <p className="text-white font-medium">{event.venue_city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'verification' && (
            <OrganizerVerificationTab />
          )}
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

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] rounded-2xl max-w-2xl w-full border border-[#2A2A2A]">
            <div className="p-6 border-b border-[#0F0F0F] flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">🎫 Gestion Événement</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#B5B5B5] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#B5B5B5]">Titre</p>
                  <p className="text-white font-bold">{selectedEvent.title}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Statut</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedEvent.status === 'published' ? 'bg-green-600' :
                      selectedEvent.status === 'draft' ? 'bg-yellow-600' :
                      'bg-red-600'
                    } text-white`}
                  >
                    {selectedEvent.status === 'published' && '✅ Publié'}
                    {selectedEvent.status === 'draft' && '⏳ Brouillon'}
                    {selectedEvent.status === 'suspended' && '⏸️ Suspendu'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Date</p>
                  <p className="text-white">{new Date(selectedEvent.start_date).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Ville</p>
                  <p className="text-white">{selectedEvent.venue_city}</p>
                </div>
              </div>

              {selectedEvent.event_image_url && (
                <div>
                  <p className="text-sm text-[#B5B5B5] mb-2">Image</p>
                  <img
                    src={selectedEvent.event_image_url}
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="bg-[#0F0F0F] rounded-lg p-4 border border-[#2A2A2A]">
                <p className="text-sm text-[#B5B5B5] mb-2">Actions disponibles</p>
                <div className="space-y-2">
                  {selectedEvent.status === 'draft' && (
                    <div className="flex items-center text-green-400 text-sm">
                      <Zap className="w-4 h-4 mr-2" />
                      <span>Master GO - Active l'événement pour les ventes</span>
                    </div>
                  )}
                  {selectedEvent.status === 'published' && (
                    <div className="flex items-center text-yellow-400 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Suspension - Bloque temporairement les ventes</span>
                    </div>
                  )}
                  <div className="flex items-center text-red-400 text-sm">
                    <X className="w-4 h-4 mr-2" />
                    <span>Suppression - Action irréversible</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedEvent.status === 'draft' && (
                  <button
                    onClick={() => handleMasterGo(selectedEvent.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50 flex items-center justify-center"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    MASTER GO
                  </button>
                )}

                {selectedEvent.status === 'published' && (
                  <button
                    onClick={() => handleSuspendEvent(selectedEvent.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
                  >
                    ⏸️ Suspendre
                  </button>
                )}

                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
                >
                  🗑️ Supprimer
                </button>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full px-6 py-3 bg-[#0F0F0F] hover:bg-[#2A2A2A] text-white rounded-lg transition-colors border border-[#2A2A2A]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] max-w-2xl w-full border border-[#2A2A2A]" style={{ borderRadius: '40px 120px 40px 120px' }}>
            <div className="p-6 border-b border-[#0F0F0F] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white">📦 Génération de Bloc de Billets</h2>
                <p className="text-[#B5B5B5] text-sm mt-1">Allouer un quota de billets à un organisateur</p>
              </div>
              <button
                onClick={() => !bulkProcessing && setShowBulkModal(false)}
                disabled={bulkProcessing}
                className="text-[#B5B5B5] hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Organisateur <span className="text-red-500">*</span>
                </label>
                <select
                  value={bulkForm.organizer_id}
                  onChange={(e) => {
                    setBulkForm({ ...bulkForm, organizer_id: e.target.value, event_id: '' });
                    if (e.target.value) loadOrganizerEvents(e.target.value);
                  }}
                  disabled={bulkProcessing}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white font-medium transition-colors focus:border-purple-600 focus:outline-none disabled:opacity-50"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  <option value="">Sélectionner un organisateur</option>
                  {organizers.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.organization_name} - {org.contact_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Événement <span className="text-red-500">*</span>
                </label>
                <select
                  value={bulkForm.event_id}
                  onChange={(e) => setBulkForm({ ...bulkForm, event_id: e.target.value })}
                  disabled={!bulkForm.organizer_id || bulkProcessing}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white font-medium transition-colors focus:border-purple-600 focus:outline-none disabled:opacity-50"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  <option value="">Sélectionner un événement</option>
                  {organizerEvents.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.start_date).toLocaleDateString('fr-FR')}
                    </option>
                  ))}
                </select>
                {bulkForm.organizer_id && organizerEvents.length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">Aucun événement publié pour cet organisateur</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Nombre de billets <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkForm.quantity}
                    onChange={(e) => setBulkForm({ ...bulkForm, quantity: e.target.value })}
                    disabled={bulkProcessing}
                    placeholder="Ex: 100"
                    className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white font-medium transition-colors focus:border-purple-600 focus:outline-none disabled:opacity-50"
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">
                    Prix unitaire (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkForm.unit_price}
                    onChange={(e) => setBulkForm({ ...bulkForm, unit_price: e.target.value })}
                    disabled={bulkProcessing}
                    placeholder="Ex: 5000"
                    className="w-full px-4 py-3 bg-[#0F0F0F] border-2 border-[#2A2A2A] text-white font-medium transition-colors focus:border-purple-600 focus:outline-none disabled:opacity-50"
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                  />
                </div>
              </div>

              {bulkForm.quantity && bulkForm.unit_price && (
                <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-2 border-purple-600 p-4" style={{ borderRadius: '20px 8px 20px 8px' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[#B5B5B5] font-bold">Valeur totale du bloc :</span>
                    <span className="text-white font-black text-2xl">
                      {(parseInt(bulkForm.quantity || '0') * parseInt(bulkForm.unit_price || '0')).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              )}

              {bulkProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#B5B5B5]">Génération en cours...</span>
                    <span className="text-purple-400 font-bold">{bulkProgress}%</span>
                  </div>
                  <div className="w-full bg-[#0F0F0F] rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500"
                      style={{ width: `${bulkProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkProcessing}
                  className="flex-1 px-6 py-3 bg-[#0F0F0F] hover:bg-[#2A2A2A] text-white font-bold transition-colors border border-[#2A2A2A] disabled:opacity-50"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateBulk}
                  disabled={bulkProcessing || !bulkForm.organizer_id || !bulkForm.event_id || !bulkForm.quantity || !bulkForm.unit_price}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                  style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                  {bulkProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Générer le Bloc
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
