import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Shield,
  Zap,
  TrendingUp,
  Activity,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import DynamicLogo from '../components/DynamicLogo';
import type { Event } from '../types';

interface OpsStats {
  totalEvents: number;
  activeEvents: number;
  verifiedOrganizers: number;
  totalTicketsSold: number;
  occupancyRate: number;
}

interface RecentActivity {
  action: string;
  organizer: string;
  event?: string;
  time: string;
  timestamp: any;
}

export default function OpsManagerPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, firebaseUser } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<OpsStats>({
    totalEvents: 0,
    activeEvents: 0,
    verifiedOrganizers: 0,
    totalTicketsSold: 0,
    occupancyRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
      navigate('/admin/ops/login');
    }
  };

  useEffect(() => {
    console.log('[OPS MANAGER] Auth state:', {
      authLoading,
      user: user?.email,
      role: user?.role,
      uid: firebaseUser?.uid
    });

    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        console.log('[OPS MANAGER] Access denied, redirecting to home');
        navigate('/');
      } else {
        console.log('[OPS MANAGER] Access granted');
        loadOpsData();
      }
    }
  }, [authLoading, user, navigate]);

  const loadOpsData = async () => {
    try {
      setLoading(true);
      console.log('[OPS MANAGER] Loading data from Firebase...');

      const eventsRef = collection(firestore, 'events');
      const eventsSnapshot = await getDocs(eventsRef);

      const loadedEvents = await Promise.all(
        eventsSnapshot.docs.map(async (eventDoc) => {
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;

          const ticketTypesRef = collection(firestore, 'ticket_types');
          const ticketTypesQuery = query(ticketTypesRef, where('event_id', '==', eventData.id));
          const ticketTypesSnapshot = await getDocs(ticketTypesQuery);
          eventData.ticket_types = ticketTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          if (eventData.organizer_id) {
            const organizersRef = collection(firestore, 'organizers');
            const organizerQuery = query(organizersRef, where('__name__', '==', eventData.organizer_id));
            const organizerSnapshot = await getDocs(organizerQuery);
            if (!organizerSnapshot.empty) {
              eventData.organizer = { id: organizerSnapshot.docs[0].id, ...organizerSnapshot.docs[0].data() };
            }
          }

          return eventData;
        })
      );

      setEvents(loadedEvents);

      const organizersRef = collection(firestore, 'organizers');
      const verifiedOrganizersQuery = query(organizersRef, where('verification_status', '==', 'verified'));
      const verifiedOrganizersSnapshot = await getDocs(verifiedOrganizersQuery);

      const activeEvents = loadedEvents.filter(e => e.status === 'published').length;
      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;

      for (const event of loadedEvents) {
        const soldTickets = event.ticket_types?.reduce((sum, t) => sum + t.quantity_sold, 0) || 0;
        const totalTickets = event.ticket_types?.reduce((sum, t) => sum + t.quantity_total, 0) || 0;
        totalTicketsSold += soldTickets;
        totalTicketsAvailable += totalTickets;
      }

      const occupancyRate = totalTicketsAvailable > 0 ? Math.round((totalTicketsSold / totalTicketsAvailable) * 100) : 0;

      setStats({
        totalEvents: loadedEvents.length,
        activeEvents,
        verifiedOrganizers: verifiedOrganizersSnapshot.size,
        totalTicketsSold,
        occupancyRate,
      });

      const activities: RecentActivity[] = [];

      for (const event of loadedEvents.slice(0, 10)) {
        if (event.created_at) {
          activities.push({
            action: `Événement créé: ${event.title}`,
            organizer: event.organizer?.organization_name || 'Organisateur',
            event: event.title,
            time: formatRelativeTime(event.created_at),
            timestamp: event.created_at,
          });
        }
      }

      activities.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setRecentActivities(activities.slice(0, 10));

      console.log('[OPS MANAGER] Data loaded successfully');
    } catch (error) {
      console.error('[OPS MANAGER] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return '';
    const now = Date.now();
    const time = timestamp.seconds ? timestamp.seconds * 1000 : new Date(timestamp).getTime();
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
            isDark ? 'border-amber-600' : 'border-orange-500'
          }`}></div>
          <p className={`text-sm ${isDark ? 'text-amber-400' : 'text-slate-600'}`}>
            Chargement du tableau de bord...
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
            <div className="flex items-center gap-4">
              <DynamicLogo />
              <div>
                <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Ops Manager
                </h1>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-400/80' : 'text-slate-600'}`}>
                  Gestion des opérations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-slate-600'}`}>
                {user?.email}
              </span>
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
              ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-800/40'
              : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-amber-800/40' : 'bg-amber-100'
              }`}>
                <Calendar className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <TrendingUp className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stats.totalEvents}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-amber-400/60' : 'text-amber-600'}`}>
              Total Événements
            </p>
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/40'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                isDark ? 'bg-green-800/40' : 'bg-green-100'
              }`}>
                <Zap className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <Activity className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stats.activeEvents}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-green-400/60' : 'text-green-600'}`}>
              Événements Actifs
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
                <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stats.verifiedOrganizers}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-blue-400/60' : 'text-blue-600'}`}>
              Organisateurs Vérifiés
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
                <MapPin className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-orange-600'}`}>
                {stats.occupancyRate}%
              </span>
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stats.totalTicketsSold}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-purple-400/60' : 'text-purple-600'}`}>
              Billets Vendus
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`rounded-[32px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/40'
              : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="mb-6">
              <h2 className={`text-2xl font-black flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Activity className="w-6 h-6" />
                Activités Récentes
              </h2>
            </div>

            {recentActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className={`w-20 h-20 mx-auto mb-4 ${
                  isDark ? 'text-amber-700/40' : 'text-slate-300'
                }`} />
                <p className={`${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                  Aucune activité récente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-4 border ${
                      isDark
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${
                        isDark ? 'bg-amber-800/40' : 'bg-orange-100'
                      }`}>
                        {activity.action.includes('créé') && (
                          <Calendar className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-orange-600'}`} />
                        )}
                        {activity.action.includes('vérifié') && (
                          <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        )}
                        {activity.action.includes('publié') && (
                          <Zap className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {activity.action}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                          {activity.organizer}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${isDark ? 'text-amber-400/80' : 'text-slate-500'}`}>
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-[32px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/40'
              : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="mb-6">
              <h2 className={`text-2xl font-black flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Calendar className="w-6 h-6" />
                Événements Actifs
              </h2>
            </div>

            {events.filter(e => e.status === 'published').length === 0 ? (
              <div className="text-center py-12">
                <Calendar className={`w-20 h-20 mx-auto mb-4 ${
                  isDark ? 'text-amber-700/40' : 'text-slate-300'
                }`} />
                <p className={`${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                  Aucun événement actif
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.filter(e => e.status === 'published').slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-2xl p-4 border ${
                      isDark
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {event.title}
                      </h3>
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-green-500/20 text-green-400">
                        Publié
                      </span>
                    </div>
                    <div className={`flex flex-wrap gap-3 text-xs ${
                      isDark ? 'text-amber-400/60' : 'text-slate-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.start_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.venue_city}
                      </div>
                      {event.organizer && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.organizer.organization_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
