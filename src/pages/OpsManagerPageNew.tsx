import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Shield,
  Activity,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  CheckCircle,
  Eye,
  UserCheck,
  Scan,
  Database,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { firestore } from '../firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import AgentManagementModal from '../components/AgentManagementModal';
import SecurityAgentsDatabase from '../components/SecurityAgentsDatabase';
import ConfirmModal from '../components/ConfirmModal';
import type { Event } from '../types';

interface AgentStats {
  agent_id: string;
  agent_name: string;
  scans_count: number;
  last_scan: any;
  event_id: string;
}

export default function OpsManagerPageNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, firebaseUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showAgentsDatabase, setShowAgentsDatabase] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalEvents: 0,
    activeAgents: 0,
    totalScans: 0,
    activeEvents: 0,
  });

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/admin/ops/login');
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        navigate('/');
      } else {
        loadData();
      }
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (selectedEvent) {
      const unsubscribe = setupRealTimeStats(selectedEvent.id);
      return () => unsubscribe();
    }
  }, [selectedEvent]);

  const loadData = async () => {
    try {
      setLoading(true);
      const eventsRef = collection(firestore, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      const loadedEvents = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      const publishedEvents = loadedEvents.filter(e => e.status === 'published');
      setEvents(publishedEvents);

      const agentCodesRef = collection(firestore, 'agent_access_codes');
      const agentCodesSnapshot = await getDocs(query(agentCodesRef, where('is_active', '==', true)));

      const scansRef = collection(firestore, 'agent_scans');
      const scansSnapshot = await getDocs(scansRef);

      setGlobalStats({
        totalEvents: loadedEvents.length,
        activeAgents: agentCodesSnapshot.size,
        totalScans: scansSnapshot.size,
        activeEvents: publishedEvents.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeStats = (eventId: string) => {
    const scansRef = collection(firestore, 'agent_scans');
    const scansQuery = query(scansRef, where('event_id', '==', eventId));

    return onSnapshot(scansQuery, (snapshot) => {
      const statsMap = new Map<string, AgentStats>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const agentId = data.agent_id;

        if (!statsMap.has(agentId)) {
          statsMap.set(agentId, {
            agent_id: agentId,
            agent_name: data.agent_name || 'Agent',
            scans_count: 0,
            last_scan: null,
            event_id: eventId,
          });
        }

        const stats = statsMap.get(agentId)!;
        stats.scans_count++;

        if (!stats.last_scan || data.scanned_at?.seconds > stats.last_scan?.seconds) {
          stats.last_scan = data.scanned_at;
        }
      });

      setAgentStats(Array.from(statsMap.values()));
    });
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Jamais';
    const now = Date.now();
    const time = timestamp.seconds ? timestamp.seconds * 1000 : new Date(timestamp).getTime();
    const diff = now - time;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (seconds < 60) return `Il y a ${seconds}s`;
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return new Date(time).toLocaleDateString('fr-FR');
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
            isDark ? 'border-blue-600' : 'border-blue-500'
          }`}></div>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
      } backdrop-blur-xl border-b ${isDark ? 'border-slate-800' : 'border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                isDark ? 'bg-gradient-to-br from-blue-600 to-cyan-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Ops Manager
                </h1>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Gestion des Agents Contrôleurs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAgentsDatabase(true)}
                className={`px-5 py-3 rounded-xl transition-all duration-300 font-bold text-sm flex items-center gap-2 ${
                  isDark
                    ? 'bg-blue-900/20 hover:bg-blue-900/40 text-blue-400'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                }`}
              >
                <Database className="w-5 h-5" />
                Base Contrôleurs
              </button>
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  isDark
                    ? 'bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title={isDark ? 'Mode clair' : 'Mode sombre'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className={`px-5 py-3 rounded-xl transition-all duration-300 font-bold text-sm flex items-center gap-2 ${
                  isDark
                    ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400'
                    : 'bg-red-50 hover:bg-red-100 text-red-600'
                }`}
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <Calendar className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {globalStats.activeEvents}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Événements actifs
            </p>
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <UserCheck className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {globalStats.activeAgents}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Agents actifs
            </p>
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <Scan className={`w-8 h-8 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {globalStats.totalScans}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Scans totaux
            </p>
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <Activity className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
            </div>
            <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {agentStats.length}
            </p>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Agents en service
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Événements Actifs
              </h2>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? 'text-slate-700' : 'text-slate-300'
                }`} />
                <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Aucun événement actif
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedEvent?.id === event.id
                        ? isDark
                          ? 'bg-blue-900/40 border-blue-600'
                          : 'bg-blue-50 border-blue-500'
                        : isDark
                        ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-bold mb-1 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {event.title}
                        </h3>
                        <p className={`text-sm ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {event.venue_city}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowAgentModal(true);
                        }}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                          isDark
                            ? 'bg-blue-900/60 hover:bg-blue-900 text-blue-300'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-[24px] p-6 border ${
            isDark
              ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <Activity className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Stats Agents en Temps Réel
              </h2>
            </div>

            {!selectedEvent ? (
              <div className="text-center py-12">
                <Eye className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? 'text-slate-700' : 'text-slate-300'
                }`} />
                <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sélectionnez un événement
                </p>
              </div>
            ) : agentStats.length === 0 ? (
              <div className="text-center py-12">
                <Users className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? 'text-slate-700' : 'text-slate-300'
                }`} />
                <p className={`font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Aucun agent assigné
                </p>
                <button
                  onClick={() => setShowAgentModal(true)}
                  className={`mt-4 px-4 py-2 rounded-lg font-bold text-sm ${
                    isDark
                      ? 'bg-blue-900/60 hover:bg-blue-900 text-blue-300'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  Assigner des agents
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {agentStats.map((stat) => (
                  <div
                    key={stat.agent_id}
                    className={`p-4 rounded-xl border ${
                      isDark
                        ? 'bg-slate-900/40 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <UserCheck className={`w-5 h-5 ${
                          isDark ? 'text-green-400' : 'text-green-500'
                        }`} />
                        <h4 className={`font-bold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {stat.agent_name}
                        </h4>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isDark
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        Actif
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className={`text-xs font-medium ${
                          isDark ? 'text-slate-500' : 'text-slate-500'
                        }`}>
                          Scans effectués
                        </p>
                        <p className={`text-2xl font-black mt-1 ${
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {stat.scans_count}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${
                          isDark ? 'text-slate-500' : 'text-slate-500'
                        }`}>
                          Dernier scan
                        </p>
                        <p className={`text-sm font-bold mt-1 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {formatRelativeTime(stat.last_scan)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-[32px] p-8 border mt-8 ${
          isDark
            ? 'bg-gradient-to-br from-purple-950/40 to-pink-950/40 border-purple-800/40'
            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-2xl ${
              isDark ? 'bg-purple-900/60' : 'bg-purple-100'
            }`}>
              <Shield className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  EPscan+
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  isDark
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                } shadow-lg`}>
                  PREMIUM
                </span>
              </div>
              <p className={`text-lg mb-6 ${isDark ? 'text-purple-300/80' : 'text-purple-900'}`}>
                Version avancée du scanner EPscan avec fonctionnalités premium pour les grands événements
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${
                  isDark ? 'bg-purple-900/40' : 'bg-white'
                }`}>
                  <CheckCircle className={`w-5 h-5 mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mode Hors Ligne
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-purple-300/70' : 'text-purple-800'}`}>
                    Scan sans connexion internet
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${
                  isDark ? 'bg-purple-900/40' : 'bg-white'
                }`}>
                  <CheckCircle className={`w-5 h-5 mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Statistiques Avancées
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-purple-300/70' : 'text-purple-800'}`}>
                    Analytics détaillées en temps réel
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${
                  isDark ? 'bg-purple-900/40' : 'bg-white'
                }`}>
                  <CheckCircle className={`w-5 h-5 mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Multi-Agents
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-purple-300/70' : 'text-purple-800'}`}>
                    Gestion coordonnée de plusieurs points d'entrée
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl flex items-center justify-between ${
                isDark ? 'bg-purple-900/20' : 'bg-purple-100'
              }`}>
                <div className="flex items-center gap-2">
                  <Shield className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                    Accès EPscan+ réservé aux organisateurs premium
                  </span>
                </div>
                <button
                  className={`px-6 py-2 rounded-xl font-black text-sm transition-all ${
                    isDark
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  } shadow-lg`}
                  onClick={() => alert('Pour accéder à EPscan+, contactez : contact@evenpass.sn')}
                >
                  En savoir plus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAgentModal && selectedEvent && (
        <AgentManagementModal
          isDark={isDark}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          onClose={() => setShowAgentModal(false)}
        />
      )}

      {showAgentsDatabase && (
        <SecurityAgentsDatabase
          isDark={isDark}
          onClose={() => setShowAgentsDatabase(false)}
        />
      )}

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter du panneau Ops Manager ?"
        type="warning"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        isDark={isDark}
      />
    </div>
  );
}
