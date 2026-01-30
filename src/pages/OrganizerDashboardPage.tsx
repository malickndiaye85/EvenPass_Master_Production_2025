import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Ticket,
  Users,
  Clock,
  CheckCircle,
  LogOut,
  Plus,
  X,
  AlertCircle,
  Send,
  Package,
  Edit,
  FileText,
  LayoutDashboard,
  Moon,
  Sun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { firestore } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import DynamicLogo from '../components/DynamicLogo';
import CreateEventModal from '../components/CreateEventModal';
import type { Event, PayoutRequest } from '../types';

interface EventStats {
  totalTickets: number;
  soldTickets: number;
  remainingTickets: number;
  revenue: number;
}

interface ModificationRequest {
  id?: string;
  event_id: string;
  event_name: string;
  request_type: 'report' | 'modification';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: any;
}

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, firebaseUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [modificationRequests, setModificationRequests] = useState<ModificationRequest[]>([]);
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [organizerData, setOrganizerData] = useState<any>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  const [bulkStock, setBulkStock] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [mobileMoneyFees, setMobileMoneyFees] = useState(0);
  const [platformCommission, setPlatformCommission] = useState(0);

  const [requestForm, setRequestForm] = useState({
    event_id: '',
    request_type: 'modification' as 'report' | 'modification',
    description: '',
  });

  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
      navigate('/organizer/login');
    }
  };

  useEffect(() => {
    console.log('[ORGANIZER DASHBOARD] Auth state:', {
      authLoading,
      user: user?.email,
      role: user?.role,
      uid: firebaseUser?.uid,
      organizerStatus: user?.organizer?.verification_status
    });

    if (!authLoading) {
      if (!user) {
        console.log('[ORGANIZER DASHBOARD] No user, redirecting to login');
        navigate('/organizer/login');
      } else if (user.role !== 'organizer' && user.role !== 'admin') {
        console.log('[ORGANIZER DASHBOARD] Not an organizer, redirecting to home');
        navigate('/');
      } else {
        console.log('[ORGANIZER DASHBOARD] Access granted, loading data');
        loadOrganizerData();
      }
    }
  }, [authLoading, user, navigate]);

  const loadOrganizerData = async () => {
    if (!firebaseUser?.uid) return;

    try {
      setLoading(true);
      console.log('[ORGANIZER DASHBOARD] Loading data for UID:', firebaseUser.uid);

      const categoriesRef = collection(firestore, 'event_categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const loadedCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(loadedCategories);

      const organizersRef = collection(firestore, 'organizers');
      const organizerDocRef = doc(firestore, 'organizers', firebaseUser.uid);
      const organizerDocSnap = await getDoc(organizerDocRef);

      let organizer: any;
      if (!organizerDocSnap.exists()) {
        console.log('[ORGANIZER DASHBOARD] Creating organizer profile for UID:', firebaseUser.uid);
        const newOrganizerData = {
          user_id: firebaseUser.uid,
          email: firebaseUser.email || '',
          organization_name: firebaseUser.email?.split('@')[0] || 'Organisation',
          phone: '',
          address: '',
          verified: true,
          created_at: Timestamp.now(),
          status: 'active'
        };
        await setDoc(organizerDocRef, newOrganizerData);
        organizer = { id: firebaseUser.uid, ...newOrganizerData };
      } else {
        organizer = { id: organizerDocSnap.id, ...organizerDocSnap.data() };
      }

      setOrganizerData(organizer);

      const eventsRef = collection(firestore, 'events');
      const eventsQuery = query(eventsRef, where('organizer_id', '==', firebaseUser.uid));
      const eventsSnapshot = await getDocs(eventsQuery);

      const loadedEvents = await Promise.all(
        eventsSnapshot.docs.map(async (eventDoc) => {
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;

          const ticketTypesRef = collection(firestore, 'ticket_types');
          const ticketTypesQuery = query(ticketTypesRef, where('event_id', '==', eventData.id));
          const ticketTypesSnapshot = await getDocs(ticketTypesQuery);
          eventData.ticket_types = ticketTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          if (eventData.category_id) {
            const categoryDoc = await getDoc(doc(firestore, 'event_categories', eventData.category_id));
            eventData.category = categoryDoc.exists() ? { id: categoryDoc.id, ...categoryDoc.data() } : null;
          }

          return eventData;
        })
      );

      setEvents(loadedEvents);

      const stats: Record<string, EventStats> = {};
      let totalRev = 0;
      let totalSold = 0;

      for (const event of loadedEvents) {
        const totalTickets = event.ticket_types?.reduce((sum, t) => sum + t.quantity_total, 0) || 0;
        const soldTickets = event.ticket_types?.reduce((sum, t) => sum + t.quantity_sold, 0) || 0;
        const remainingTickets = totalTickets - soldTickets;

        const bookingsRef = collection(firestore, 'bookings');
        const bookingsQuery = query(
          bookingsRef,
          where('event_id', '==', event.id),
          where('status', '==', 'confirmed')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const revenue = bookingsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total_amount || 0), 0);

        stats[event.id] = {
          totalTickets,
          soldTickets,
          remainingTickets,
          revenue,
        };

        totalRev += revenue;
        totalSold += soldTickets;
      }

      setEventStats(stats);
      setTotalRevenue(totalRev);
      setTotalTicketsSold(totalSold);

      const commission = totalRev * 0.05;
      const fees = totalRev * 0.015;
      setPlatformCommission(commission);
      setMobileMoneyFees(fees);

      const payoutsRef = collection(firestore, 'payout_requests');
      const payoutsQuery = query(payoutsRef, where('organizer_id', '==', organizerDoc.id));
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const loadedPayouts = payoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PayoutRequest[];
      setPayouts(loadedPayouts);

      const requestsRef = collection(firestore, 'modification_requests');
      const requestsQuery = query(requestsRef, where('organizer_id', '==', organizerDoc.id));
      const requestsSnapshot = await getDocs(requestsQuery);
      const loadedRequests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ModificationRequest[];
      setModificationRequests(loadedRequests);

      const bulkSalesRef = collection(firestore, 'bulk_sales');
      const bulkSalesQuery = query(bulkSalesRef, where('organizer_id', '==', organizerDoc.id));
      const bulkSalesSnapshot = await getDocs(bulkSalesQuery);
      const totalBulk = bulkSalesSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + ((data.quantity_allocated || 0) - (data.quantity_sold || 0));
      }, 0);
      setBulkStock(totalBulk);

      console.log('[ORGANIZER DASHBOARD] Data loaded successfully:', {
        events: loadedEvents.length,
        totalRevenue: totalRev,
        totalSold,
        bulkStock: totalBulk
      });

    } catch (error) {
      console.error('[ORGANIZER DASHBOARD] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      alert('Vous devez être connecté pour envoyer une demande');
      return;
    }

    setProcessing(true);
    try {
      const selectedEvent = events.find(e => e.id === requestForm.event_id);
      if (!selectedEvent) {
        alert('Veuillez sélectionner un événement');
        setProcessing(false);
        return;
      }

      if (!requestForm.description.trim()) {
        alert('Veuillez décrire votre demande');
        setProcessing(false);
        return;
      }

      const requestData = {
        organizer_id: firebaseUser.uid,
        event_id: requestForm.event_id,
        event_name: selectedEvent.title,
        request_type: requestForm.request_type,
        description: requestForm.description,
        status: 'pending',
        created_at: Timestamp.now(),
      };

      console.log('[ORGANIZER DASHBOARD] Submitting request:', requestData);
      const docRef = await addDoc(collection(firestore, 'modification_requests'), requestData);
      console.log('[ORGANIZER DASHBOARD] Request submitted successfully with ID:', docRef.id);

      alert('Demande envoyée avec succès! L\'admin va la traiter.');
      setShowRequestModal(false);
      setRequestForm({
        event_id: '',
        request_type: 'modification',
        description: '',
      });
      loadOrganizerData();
    } catch (error: any) {
      console.error('[ORGANIZER DASHBOARD] Error submitting request:', error);
      alert(`Erreur lors de l'envoi de la demande: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0B]' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
            isDark ? 'border-[#10B981]' : 'border-orange-500'
          }`}></div>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0B]' : 'bg-[#F9FAFB]'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-[#0A0A0B]/95 backdrop-blur-xl' : 'bg-white'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DynamicLogo size="sm" />
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Bonjour, {organizerData?.organization_name || organizerData?.contact_name || 'Organisateur'}
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gérez vos événements et suivez vos performances
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateEventModal(true)}
                className={`px-4 py-2.5 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  isDark ? 'bg-[#10B981] hover:bg-[#059669] text-white' : 'bg-[#FF6B00] hover:bg-[#E55F00] text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Créer un événement
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-lg transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={isDark ? 'Mode clair' : 'Mode sombre'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className={`p-2.5 rounded-lg transition-colors ${
                  isDark ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'
                }`}
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className={`relative rounded-xl overflow-hidden ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-white'
          } shadow-[0_2px_8px_rgba(0,0,0,0.06)]`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B00]"></div>
            <div className="p-5 pl-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💰</span>
                <span className={`text-xs font-bold tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  REVENUS
                </span>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalRevenue.toLocaleString()} F
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm font-semibold">+15% ↑</span>
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Confirmés
              </div>
            </div>
          </div>

          {/* Tickets Card */}
          <div className={`relative rounded-xl overflow-hidden ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-white'
          } shadow-[0_2px_8px_rgba(0,0,0,0.06)]`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B00]"></div>
            <div className="p-5 pl-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎫</span>
                <span className={`text-xs font-bold tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  BILLETS
                </span>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalTicketsSold}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm font-semibold">Vendus</span>
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {events.reduce((sum, e) => sum + (eventStats[e.id]?.remainingTickets || 0), 0)} restants
              </div>
            </div>
          </div>

          {/* Payments Card */}
          <div className={`relative rounded-xl overflow-hidden ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-white'
          } shadow-[0_2px_8px_rgba(0,0,0,0.06)]`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B00]"></div>
            <div className="p-5 pl-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💳</span>
                <span className={`text-xs font-bold tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  PAIEMENTS
                </span>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {payouts.filter(p => p.status === 'completed').length}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-sm font-semibold">Complétés</span>
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {payouts.filter(p => p.status === 'pending').length} en attente
              </div>
            </div>
          </div>

          {/* Scans Card */}
          <div className={`relative rounded-xl overflow-hidden ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-white'
          } shadow-[0_2px_8px_rgba(0,0,0,0.06)]`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B00]"></div>
            <div className="p-5 pl-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📊</span>
                <span className={`text-xs font-bold tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  SCANS
                </span>
              </div>
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalTicketsSold}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-sm font-semibold">Billets actifs</span>
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Prêts à scanner
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Scan Preview */}
        {events.filter(e => e.status === 'published').length > 0 && (
          <div className={`rounded-xl mb-8 ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-white'
          } shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6`}>
            <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Événements en cours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.filter(e => e.status === 'published').slice(0, 3).map(event => {
                const stats = eventStats[event.id];
                const scanRate = stats && stats.totalTickets > 0
                  ? Math.round((stats.soldTickets / stats.totalTickets) * 100)
                  : 0;

                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${
                      isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {event.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        🟢 Actif
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          Vendus
                        </span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats?.soldTickets || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          Total
                        </span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats?.totalTickets || 0}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div
                          className="h-full bg-[#FF6B00] transition-all duration-500"
                          style={{ width: `${scanRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {scanRate}% vendus
                        </span>
                        <button className="text-xs text-[#FF6B00] hover:underline font-medium">
                          Voir détails →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Events List */}
        <div className={`rounded-xl ${
          isDark ? 'bg-[#0a0a0a]' : 'bg-white'
        } shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 mb-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Mes Événements
            </h2>

            {/* Tabs and Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className={`flex gap-2 p-1 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setEventFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    eventFilter === 'all'
                      ? 'bg-[#FF6B00] text-white'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setEventFilter('upcoming')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    eventFilter === 'upcoming'
                      ? 'bg-[#FF6B00] text-white'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  À venir
                </button>
                <button
                  onClick={() => setEventFilter('ongoing')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    eventFilter === 'ongoing'
                      ? 'bg-[#FF6B00] text-white'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En cours
                </button>
                <button
                  onClick={() => setEventFilter('past')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    eventFilter === 'past'
                      ? 'bg-[#FF6B00] text-white'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Passés
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-4 pr-10 py-2 rounded-lg border text-sm ${
                    isDark
                      ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50`}
                />
              </div>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Aucun événement créé
              </p>
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="mt-4 px-4 py-2 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-semibold rounded-lg transition-colors"
              >
                Créer votre premier événement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {events
                .filter(event => {
                  if (searchQuery) {
                    return event.title.toLowerCase().includes(searchQuery.toLowerCase());
                  }
                  const now = new Date();
                  const eventDate = new Date(event.start_date);

                  if (eventFilter === 'upcoming') return eventDate > now && event.status !== 'published';
                  if (eventFilter === 'ongoing') return event.status === 'published';
                  if (eventFilter === 'past') return eventDate < now;
                  return true;
                })
                .map((event) => {
                  const stats = eventStats[event.id] || {
                    totalTickets: 0,
                    soldTickets: 0,
                    remainingTickets: 0,
                    revenue: 0,
                  };

                  const statusConfig = {
                    published: { label: 'Actif', color: 'bg-green-100 text-green-700', icon: '🟢' },
                    draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
                    cancelled: { label: 'Terminé', color: 'bg-gray-400 text-gray-700', icon: '🔴' },
                  };

                  const status = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.draft;

                  return (
                    <div
                      key={event.id}
                      className={`rounded-lg border overflow-hidden ${
                        isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-gray-50 border-gray-200'
                      } hover:shadow-md transition-shadow`}
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Event Image */}
                        {event.banner_url && (
                          <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                            <img
                              src={event.banner_url}
                              alt={event.title}
                              className="w-full h-full object-cover"
                              style={{ aspectRatio: '16/9' }}
                            />
                          </div>
                        )}

                        {/* Event Info */}
                        <div className="flex-1 p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {event.title}
                              </h3>
                              <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Calendar className="w-4 h-4" />
                                {new Date(event.start_date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              <p className={`text-sm flex items-center gap-2 mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span>📍</span>
                                {event.venue_city}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                              {status.icon} {status.label}
                            </span>
                          </div>

                          {/* Mini Stats */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Vendus</p>
                              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.soldTickets}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Revenus</p>
                              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.revenue.toLocaleString()} F
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Statut</p>
                              <p className={`text-sm font-semibold ${status.color.includes('green') ? 'text-green-600' : status.color.includes('yellow') ? 'text-yellow-600' : 'text-gray-600'}`}>
                                {status.label}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => navigate(`/organizer/events/${event.id}/stats`)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                isDark
                                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              📊 Stats
                            </button>
                            <button
                              onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                isDark
                                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => navigate(`/events/${event.id}`)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                isDark
                                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                  : 'border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-[#FF6B00]'
                              }`}
                            >
                              👁️ Voir page
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Payouts and Requests Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className={`rounded-xl ${
              isDark ? 'bg-[#0a0a0a]' : 'bg-white'
            } shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Historique Payouts
                </h2>
              </div>

              {payouts.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                  <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Aucun payout effectué
                  </p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Les virements sont automatisés par l'admin
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className={`rounded-lg p-4 border ${
                        isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {payout.request_number}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(payout.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payout.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : payout.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : payout.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {payout.status === 'completed' && 'Complété'}
                          {payout.status === 'pending' && 'En attente'}
                          {payout.status === 'rejected' && 'Rejeté'}
                          {payout.status === 'processing' && 'En cours'}
                          {payout.status === 'approved' && 'Approuvé'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Montant
                          </p>
                          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {payout.amount_requested.toLocaleString()} F
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Frais
                          </p>
                          <p className={`text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            -{payout.technical_fees.toLocaleString()} F
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Net reçu
                          </p>
                          <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {payout.net_amount.toLocaleString()} F
                          </p>
                        </div>
                      </div>

                      {payout.rejection_reason && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          isDark
                            ? 'bg-red-900/20 border-red-800 text-red-300'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <p className="text-sm font-medium">
                            Raison: {payout.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className={`rounded-xl ${
              isDark ? 'bg-[#0a0a0a]' : 'bg-white'
            } shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 sticky top-24`}>
              <div className="flex items-center gap-3 mb-6">
                <Send className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Demandes
                </h2>
              </div>

              <button
                onClick={() => setShowRequestModal(true)}
                disabled={events.length === 0}
                className={`w-full px-4 py-2.5 rounded-lg transition-colors font-semibold mb-6 ${
                  events.length === 0
                    ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500'
                    : 'bg-[#FF6B00] hover:bg-[#E55F00] text-white'
                }`}
              >
                Nouvelle demande
              </button>

              {modificationRequests.length > 0 ? (
                <div className="space-y-3">
                  {modificationRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className={`rounded-lg p-3 border ${
                        isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {request.event_name}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {request.status === 'approved' && 'Approuvé'}
                          {request.status === 'pending' && 'En attente'}
                          {request.status === 'rejected' && 'Rejeté'}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {request.request_type === 'report' ? 'Report' : 'Modification'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Aucune demande pour le moment
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateEventModal && (
        <CreateEventModal
          isDark={isDark}
          organizerData={organizerData}
          categories={categories}
          onClose={() => setShowCreateEventModal(false)}
          onSuccess={loadOrganizerData}
        />
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-lg w-full border ${
            isDark ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'
          } shadow-2xl`}>
            <div className={`p-6 border-b flex justify-between items-center ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Nouvelle demande
              </h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                disabled={processing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Événement concerné
                </label>
                <select
                  value={requestForm.event_id}
                  onChange={(e) => setRequestForm({ ...requestForm, event_id: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border font-medium transition-colors ${
                    isDark
                      ? 'bg-[#1a1a1a] border-gray-700 text-white focus:border-[#FF6B00]'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-[#FF6B00]'
                  } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50`}
                  required
                  disabled={processing}
                >
                  <option value="">Sélectionner un événement</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Type de demande
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRequestForm({ ...requestForm, request_type: 'report' })}
                    className={`p-3 rounded-lg border-2 transition-all font-medium ${
                      requestForm.request_type === 'report'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                        : isDark
                          ? 'border-gray-700 text-gray-400 hover:border-gray-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    disabled={processing}
                  >
                    Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestForm({ ...requestForm, request_type: 'modification' })}
                    className={`p-3 rounded-lg border-2 transition-all font-medium ${
                      requestForm.request_type === 'modification'
                        ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                        : isDark
                          ? 'border-gray-700 text-gray-400 hover:border-gray-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    disabled={processing}
                  >
                    Modification
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Description de la demande
                </label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border font-medium transition-colors ${
                    isDark
                      ? 'bg-[#1a1a1a] border-gray-700 text-white focus:border-[#FF6B00]'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-[#FF6B00]'
                  } focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50`}
                  placeholder="Décrivez votre demande..."
                  rows={4}
                  required
                  disabled={processing}
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className={`w-full px-4 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 ${
                  processing
                    ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-200'
                    : 'bg-[#FF6B00] hover:bg-[#E55F00] text-white'
                }`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer la demande
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
