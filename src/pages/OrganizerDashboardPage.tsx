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
  FileText
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
  getDoc
} from 'firebase/firestore';
import DynamicLogo from '../components/DynamicLogo';
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
  const { isDark } = useTheme();
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

  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    start_date: '',
    venue_name: '',
    venue_city: '',
    category_id: '',
  });

  const [requestForm, setRequestForm] = useState({
    event_id: '',
    request_type: 'modification' as 'report' | 'modification',
    description: '',
  });

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

      const organizersRef = collection(firestore, 'organizers');
      const organizerQuery = query(organizersRef, where('user_id', '==', firebaseUser.uid));
      const organizerSnapshot = await getDocs(organizerQuery);

      if (organizerSnapshot.empty) {
        console.error('[ORGANIZER DASHBOARD] No organizer found for this user');
        setLoading(false);
        return;
      }

      const organizerDoc = organizerSnapshot.docs[0];
      const organizer = { id: organizerDoc.id, ...organizerDoc.data() };
      setOrganizerData(organizer);

      const eventsRef = collection(firestore, 'events');
      const eventsQuery = query(eventsRef, where('organizer_id', '==', organizerDoc.id));
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerData || !firebaseUser?.uid) return;

    setProcessing(true);
    try {
      const slug = newEventForm.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const eventData = {
        title: newEventForm.title,
        description: newEventForm.description,
        start_date: newEventForm.start_date,
        venue_name: newEventForm.venue_name,
        venue_city: newEventForm.venue_city,
        category_id: newEventForm.category_id,
        organizer_id: organizerData.id,
        slug,
        status: 'draft',
        is_featured: false,
        is_free: false,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      await addDoc(collection(firestore, 'events'), eventData);
      alert('Événement créé avec succès! Veuillez ajouter les types de billets dans la suite.');
      setShowCreateEventModal(false);
      setNewEventForm({
        title: '',
        description: '',
        start_date: '',
        venue_name: '',
        venue_city: '',
        category_id: '',
      });
      loadOrganizerData();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerData) return;

    setProcessing(true);
    try {
      const selectedEvent = events.find(e => e.id === requestForm.event_id);
      if (!selectedEvent) return;

      const requestData = {
        organizer_id: organizerData.id,
        event_id: requestForm.event_id,
        event_name: selectedEvent.title,
        request_type: requestForm.request_type,
        description: requestForm.description,
        status: 'pending',
        created_at: Timestamp.now(),
      };

      await addDoc(collection(firestore, 'modification_requests'), requestData);
      alert('Demande envoyée avec succès! L\'admin va la traiter.');
      setShowRequestModal(false);
      setRequestForm({
        event_id: '',
        request_type: 'modification',
        description: '',
      });
      loadOrganizerData();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
            isDark ? 'border-amber-600' : 'border-orange-500'
          }`}></div>
          <p className={`text-sm ${isDark ? 'text-amber-400' : 'text-slate-600'}`}>
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? 'bg-[#050505]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isDark ? 'bg-black/40' : 'bg-white/40'
      } backdrop-blur-xl border-b ${isDark ? 'border-amber-900/20' : 'border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <DynamicLogo />
              <div className="mt-2">
                <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {organizerData?.contact_name || 'Organisateur'}
                </h1>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-400/80' : 'text-slate-600'}`}>
                  {organizerData?.organization_name || 'Structure'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateEventModal(true)}
                className={`px-4 py-2.5 rounded-xl transition-all duration-300 font-bold flex items-center gap-2 ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Créer événement
              </button>
              <button
                onClick={handleLogout}
                className={`px-4 py-2.5 rounded-xl transition-all duration-300 font-bold flex items-center gap-2 ${
                  isDark
                    ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                    : 'bg-red-50 hover:bg-red-100 text-red-600'
                }`}
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/40'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-green-800/40' : 'bg-green-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-green-400/80' : 'text-green-700'}`}>
                REVENUS
              </span>
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalRevenue.toLocaleString()} F
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-green-400/60' : 'text-green-600'}`}>
              Ventes confirmées
            </p>
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/40'
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-blue-800/40' : 'bg-blue-100'
              }`}>
                <Ticket className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-blue-400/80' : 'text-blue-700'}`}>
                BILLETS
              </span>
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalTicketsSold}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-blue-400/60' : 'text-blue-600'}`}>
              Vendus au total
            </p>
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-800/40'
              : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-purple-800/40' : 'bg-purple-100'
              }`}>
                <Calendar className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-purple-400/80' : 'text-purple-700'}`}>
                ÉVÉNEMENTS
              </span>
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {events.length}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-purple-400/60' : 'text-purple-600'}`}>
              Créés
            </p>
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-800/40'
              : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-orange-800/40' : 'bg-orange-100'
              }`}>
                <Package className={`w-6 h-6 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-orange-400/80' : 'text-orange-700'}`}>
                STOCK BULK
              </span>
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {bulkStock}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-orange-400/60' : 'text-orange-600'}`}>
              Billets restants
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-[32px] p-6 border ${
              isDark
                ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/40'
                : 'bg-white border-slate-200 shadow-lg'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-black flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <Calendar className="w-6 h-6" />
                  Mes Événements
                </h2>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className={`w-20 h-20 mx-auto mb-4 ${
                    isDark ? 'text-amber-700/40' : 'text-slate-300'
                  }`} />
                  <p className={`${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                    Aucun événement créé
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => {
                    const stats = eventStats[event.id] || {
                      totalTickets: 0,
                      soldTickets: 0,
                      remainingTickets: 0,
                      revenue: 0,
                    };

                    return (
                      <div
                        key={event.id}
                        className={`rounded-2xl p-5 border ${
                          isDark
                            ? 'bg-amber-950/20 border-amber-800/40'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className={`text-lg font-black mb-1 ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {event.title}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                              {new Date(event.start_date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })} • {event.venue_city}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold ${
                              event.status === 'published'
                                ? 'bg-green-500/20 text-green-400'
                                : event.status === 'draft'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-slate-500/20 text-slate-400'
                            }`}
                          >
                            {event.status === 'published' ? 'Publié' : event.status === 'draft' ? 'Brouillon' : event.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`p-3 rounded-xl ${
                            isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                          }`}>
                            <p className={`text-xs font-semibold mb-1 ${
                              isDark ? 'text-amber-500' : 'text-slate-500'
                            }`}>
                              Vendus
                            </p>
                            <p className={`text-xl font-black ${
                              isDark ? 'text-green-400' : 'text-green-600'
                            }`}>
                              {stats.soldTickets}
                            </p>
                          </div>

                          <div className={`p-3 rounded-xl ${
                            isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                          }`}>
                            <p className={`text-xs font-semibold mb-1 ${
                              isDark ? 'text-amber-500' : 'text-slate-500'
                            }`}>
                              Restants
                            </p>
                            <p className={`text-xl font-black ${
                              isDark ? 'text-orange-400' : 'text-orange-600'
                            }`}>
                              {stats.remainingTickets}
                            </p>
                          </div>

                          <div className={`p-3 rounded-xl ${
                            isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                          }`}>
                            <p className={`text-xs font-semibold mb-1 ${
                              isDark ? 'text-amber-500' : 'text-slate-500'
                            }`}>
                              Total
                            </p>
                            <p className={`text-xl font-black ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {stats.totalTickets}
                            </p>
                          </div>

                          <div className={`p-3 rounded-xl ${
                            isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                          }`}>
                            <p className={`text-xs font-semibold mb-1 ${
                              isDark ? 'text-amber-500' : 'text-slate-500'
                            }`}>
                              Revenus
                            </p>
                            <p className={`text-lg font-black ${
                              isDark ? 'text-green-400' : 'text-green-600'
                            }`}>
                              {stats.revenue.toLocaleString()} F
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`rounded-[32px] p-6 border ${
              isDark
                ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/40'
                : 'bg-white border-slate-200 shadow-lg'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-black flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <DollarSign className="w-6 h-6" />
                  Historique Payouts
                </h2>
              </div>

              {payouts.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className={`w-20 h-20 mx-auto mb-4 ${
                    isDark ? 'text-amber-700/40' : 'text-slate-300'
                  }`} />
                  <p className={`${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                    Aucun payout effectué
                  </p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-amber-400/40' : 'text-slate-400'}`}>
                    Les virements sont automatisés par l'admin
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className={`rounded-2xl p-5 border ${
                        isDark
                          ? 'bg-amber-950/20 border-amber-800/40'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {payout.request_number}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                            {new Date(payout.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-bold ${
                            payout.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : payout.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : payout.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-blue-500/20 text-blue-400'
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
                          <p className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                            Montant
                          </p>
                          <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {payout.amount_requested.toLocaleString()} F
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                            Frais
                          </p>
                          <p className={`text-lg font-black ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            -{payout.technical_fees.toLocaleString()} F
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                            Net reçu
                          </p>
                          <p className={`text-lg font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {payout.net_amount.toLocaleString()} F
                          </p>
                        </div>
                      </div>

                      {payout.rejection_reason && (
                        <div className={`mt-3 p-3 rounded-xl border ${
                          isDark
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
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
            <div className={`rounded-[32px] p-6 border sticky top-24 ${
              isDark
                ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/40'
                : 'bg-white border-slate-200 shadow-lg'
            }`}>
              <h2 className={`text-xl font-black mb-6 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Send className="w-5 h-5" />
                Demandes
              </h2>

              <button
                onClick={() => setShowRequestModal(true)}
                disabled={events.length === 0}
                className={`w-full px-6 py-3 rounded-xl transition-all font-bold mb-6 ${
                  events.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                }`}
              >
                Nouvelle demande
              </button>

              {modificationRequests.length > 0 && (
                <div className="space-y-3">
                  {modificationRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className={`rounded-xl p-4 border ${
                        isDark
                          ? 'bg-amber-950/20 border-amber-800/40'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {request.event_name}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            request.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : request.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {request.status === 'approved' && 'Approuvé'}
                          {request.status === 'pending' && 'En attente'}
                          {request.status === 'rejected' && 'Rejeté'}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                        {request.request_type === 'report' ? 'Report' : 'Modification'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/95 to-orange-950/95 border-amber-800/40'
              : 'bg-white border-slate-200'
          }`}>
            <div className={`sticky top-0 p-6 border-b flex justify-between items-center ${
              isDark
                ? 'bg-amber-950/95 backdrop-blur-xl border-amber-800/40'
                : 'bg-white backdrop-blur-xl border-slate-200'
            }`}>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Créer un événement
              </h2>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark
                    ? 'hover:bg-amber-900/40 text-amber-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
                disabled={processing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Titre de l'événement
                </label>
                <input
                  type="text"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                    isDark
                      ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                  } focus:outline-none`}
                  placeholder="Concert de..."
                  required
                  disabled={processing}
                />
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Description
                </label>
                <textarea
                  value={newEventForm.description}
                  onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                    isDark
                      ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                  } focus:outline-none`}
                  placeholder="Décrivez votre événement..."
                  rows={4}
                  required
                  disabled={processing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-amber-300' : 'text-slate-700'
                  }`}>
                    Date et heure
                  </label>
                  <input
                    type="datetime-local"
                    value={newEventForm.start_date}
                    onChange={(e) => setNewEventForm({ ...newEventForm, start_date: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                      isDark
                        ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                    } focus:outline-none`}
                    required
                    disabled={processing}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-amber-300' : 'text-slate-700'
                  }`}>
                    Catégorie ID
                  </label>
                  <input
                    type="text"
                    value={newEventForm.category_id}
                    onChange={(e) => setNewEventForm({ ...newEventForm, category_id: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                      isDark
                        ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                    } focus:outline-none`}
                    placeholder="ID catégorie"
                    required
                    disabled={processing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-amber-300' : 'text-slate-700'
                  }`}>
                    Nom du lieu
                  </label>
                  <input
                    type="text"
                    value={newEventForm.venue_name}
                    onChange={(e) => setNewEventForm({ ...newEventForm, venue_name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                      isDark
                        ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                    } focus:outline-none`}
                    placeholder="Stade Demba Diop"
                    required
                    disabled={processing}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-amber-300' : 'text-slate-700'
                  }`}>
                    Ville
                  </label>
                  <input
                    type="text"
                    value={newEventForm.venue_city}
                    onChange={(e) => setNewEventForm({ ...newEventForm, venue_city: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                      isDark
                        ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                    } focus:outline-none`}
                    placeholder="Dakar"
                    required
                    disabled={processing}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className={`w-full px-6 py-4 rounded-2xl transition-all font-black text-lg shadow-xl flex items-center justify-center gap-2 ${
                  processing ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                }`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Créer l'événement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-[32px] max-w-lg w-full border ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/95 to-orange-950/95 border-amber-800/40'
              : 'bg-white border-slate-200'
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${
              isDark
                ? 'bg-amber-950/95 backdrop-blur-xl border-amber-800/40'
                : 'bg-white backdrop-blur-xl border-slate-200'
            }`}>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nouvelle demande
              </h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark
                    ? 'hover:bg-amber-900/40 text-amber-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
                disabled={processing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Événement concerné
                </label>
                <select
                  value={requestForm.event_id}
                  onChange={(e) => setRequestForm({ ...requestForm, event_id: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                    isDark
                      ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                  } focus:outline-none`}
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
                <label className={`block text-sm font-bold mb-3 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Type de demande
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRequestForm({ ...requestForm, request_type: 'report' })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      requestForm.request_type === 'report'
                        ? 'border-orange-500 bg-orange-500/20'
                        : isDark
                          ? 'border-amber-800/40 hover:border-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={processing}
                  >
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Report
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestForm({ ...requestForm, request_type: 'modification' })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      requestForm.request_type === 'modification'
                        ? 'border-orange-500 bg-orange-500/20'
                        : isDark
                          ? 'border-amber-800/40 hover:border-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={processing}
                  >
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Modification
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Description de la demande
                </label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                    isDark
                      ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                  } focus:outline-none`}
                  placeholder="Décrivez votre demande..."
                  rows={4}
                  required
                  disabled={processing}
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className={`w-full px-6 py-4 rounded-2xl transition-all font-black text-lg shadow-xl flex items-center justify-center gap-2 ${
                  processing ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
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
