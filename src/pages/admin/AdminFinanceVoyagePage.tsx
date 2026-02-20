import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, Lock, CheckCircle, Clock, AlertTriangle,
  RefreshCw, LogOut, X, CreditCard, Bus, Calendar, Filter, ChevronRight,
  Download, Target, Timer, Bell
} from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Trip {
  id: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  route: string;
  departure_date: string;
  arrival_date?: string;
  status: 'EN_ROUTE' | 'ARRIVÉE_CONFIRMÉE' | 'VERSÉ' | 'PRÊT_POUR_PAYOUT' | 'ALERTE';
  total_revenue: number;
  driver_amount: number;
  commission_amount: number;
  paid_at?: string;
  license_plate: string;
  service_type: 'EXPRESS' | 'ALLO_DAKAR';
  scan_montee_at?: string;
  scan_arrivee_at?: string;
  created_at: string;
}

interface SubscriptionTransaction {
  id: string;
  user_name: string;
  phone: string;
  subscription_type: string;
  amount: number;
  payment_reference: string;
  payment_method: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  pass_type?: string;
  transaction_id?: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'loading';
  message: string;
}

type TimeFilter = 'today' | '7days' | 'month';

interface PayoutPreview {
  driver_name: string;
  driver_phone: string;
  trips_count: number;
  total_amount: number;
}

const AdminFinanceVoyagePage: React.FC = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [subscriptionTransactions, setSubscriptionTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [selectedTransaction, setSelectedTransaction] = useState<SubscriptionTransaction | null>(null);
  const [showPayoutPreview, setShowPayoutPreview] = useState(false);

  const SUPER_ADMIN_UID = 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
  const MONTHLY_TARGET = 500000;

  const filterDataByTime = (data: any[], dateField: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      switch (timeFilter) {
        case 'today':
          return itemDate >= today;
        case '7days':
          return itemDate >= sevenDaysAgo;
        case 'month':
          return itemDate >= monthStart;
        default:
          return true;
      }
    });
  };

  const filteredTrips = useMemo(() => filterDataByTime(trips, 'created_at'), [trips, timeFilter]);
  const filteredSubscriptions = useMemo(() => filterDataByTime(subscriptionTransactions, 'created_at'), [subscriptionTransactions, timeFilter]);

  const totalRevenue = useMemo(() => {
    return filteredTrips.reduce((sum, trip) => sum + (trip.total_revenue || 0), 0) +
      filteredSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
  }, [filteredTrips, filteredSubscriptions]);

  const totalCommission = useMemo(() => totalRevenue * 0.05, [totalRevenue]);

  const encoursSéquestre = useMemo(() => {
    return filteredTrips
      .filter(t => t.status !== 'VERSÉ')
      .reduce((sum, trip) => sum + (trip.total_revenue || 0) * 0.95, 0);
  }, [filteredTrips]);

  const chartData = useMemo(() => {
    const last7Days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTrips = trips.filter(t => t.created_at?.startsWith(dateStr));
      const daySubs = subscriptionTransactions.filter(s => s.created_at?.startsWith(dateStr));

      const dayRevenue = dayTrips.reduce((sum, t) => sum + (t.total_revenue || 0), 0) +
        daySubs.reduce((sum, s) => sum + (s.amount || 0), 0);

      last7Days.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        revenue: Math.round(dayRevenue)
      });
    }

    return last7Days;
  }, [trips, subscriptionTransactions]);

  const timeUntil8PM = useMemo(() => {
    const now = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0);

    if (now > target) {
      target.setDate(target.getDate() + 1);
    }

    const diff = target.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min`;
  }, []);

  const payoutPreview = useMemo(() => {
    const readyTrips = trips.filter(t => t.status === 'PRÊT_POUR_PAYOUT');
    const groupedByDriver = readyTrips.reduce((acc, trip) => {
      const key = trip.driver_phone;
      if (!acc[key]) {
        acc[key] = {
          driver_name: trip.driver_name,
          driver_phone: trip.driver_phone,
          trips_count: 0,
          total_amount: 0
        };
      }
      acc[key].trips_count++;
      acc[key].total_amount += trip.total_revenue * 0.95;
      return acc;
    }, {} as Record<string, PayoutPreview>);

    return Object.values(groupedByDriver);
  }, [trips]);

  useEffect(() => {
    console.log('[FINANCE PAGE] Auth state:', {
      authLoading,
      hasUser: !!user,
      userUID: user?.id,
      expectedUID: SUPER_ADMIN_UID
    });

    if (authLoading) {
      console.log('[FINANCE PAGE] Still loading auth state...');
      return;
    }

    if (!user) {
      console.log('[FINANCE PAGE] No authenticated user');
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    console.log('[FINANCE PAGE] Current UID:', user.id);
    console.log('[FINANCE PAGE] Expected UID:', SUPER_ADMIN_UID);

    if (user.id !== SUPER_ADMIN_UID) {
      console.log('[FINANCE PAGE] ❌ Access denied - UID mismatch');
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    console.log('[FINANCE PAGE] ✅ Access granted - loading financial data');

    if (!db) {
      console.error('[FINANCE PAGE] Firebase database not initialized');
      setLoading(false);
      return;
    }

    const tripsRef = ref(db, 'transport_trips');
    const subscriptionsRef = ref(db, 'subscription_payments');

    const unsubTrips = onValue(tripsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tripsArray = Object.keys(data).map(key => {
          const trip = data[key];
          let status = trip.status || 'EN_ROUTE';

          if (trip.service_type === 'EXPRESS' && trip.scan_montee_at && status === 'EN_ROUTE') {
            status = 'PRÊT_POUR_PAYOUT';
          }

          if (trip.service_type === 'ALLO_DAKAR') {
            if (trip.scan_montee_at && !trip.scan_arrivee_at) {
              const scanTime = new Date(trip.scan_montee_at).getTime();
              const now = Date.now();
              const hoursDiff = (now - scanTime) / (1000 * 60 * 60);

              if (hoursDiff > 12) {
                status = 'ALERTE';
              }
            }

            if (trip.scan_montee_at && trip.scan_arrivee_at && status === 'EN_ROUTE') {
              status = 'PRÊT_POUR_PAYOUT';
            }
          }

          return {
            id: key,
            ...trip,
            status,
            driver_amount: trip.total_revenue * 0.95,
            commission_amount: trip.total_revenue * 0.05,
            service_type: trip.service_type || 'EXPRESS'
          };
        });
        setTrips(tripsArray);
      } else {
        setTrips([]);
      }
      setLoading(false);
    });

    const unsubSubscriptions = onValue(subscriptionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const subscriptionsArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setSubscriptionTransactions(subscriptionsArray);
      } else {
        setSubscriptionTransactions([]);
      }
    });

    return () => {
      unsubTrips();
      unsubSubscriptions();
    };
  }, [user, authLoading]);

  const showToast = (type: Toast['type'], message: string) => {
    const id = toastIdCounter;
    setToastIdCounter(prev => prev + 1);
    setToasts(prev => [...prev, { id, type, message }]);

    if (type !== 'loading') {
      setTimeout(() => hideToast(id), 5000);
    }

    return id;
  };

  const hideToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAuthorizePayout = async (tripId: string, trip: Trip) => {
    if (!db) return;

    const loadingToastId = showToast('loading', '⏳ Autorisation du versement en cours...');

    try {
      const tripRef = ref(db, `transport_trips/${tripId}`);
      await update(tripRef, {
        status: 'VERSÉ',
        paid_at: new Date().toISOString()
      });

      hideToast(loadingToastId);
      showToast('success', `✅ Versement autorisé pour ${trip.driver_name}`);
    } catch (error: any) {
      hideToast(loadingToastId);
      showToast('error', `❌ Erreur: ${error.message}`);
      console.error('Erreur autorisation payout:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/ops/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const generateMassPayJSON = () => {
    const massPayData = payoutPreview.map(p => ({
      phone: p.driver_phone,
      amount: Math.round(p.total_amount),
      name: p.driver_name,
      trips: p.trips_count
    }));

    const blob = new Blob([JSON.stringify(massPayData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mass-pay-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', '✅ Rapport Mass Pay téléchargé');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <Lock className="inline-block text-blue-500 animate-pulse" size={64} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Vérification de vos accès...</h1>
          <p className="text-gray-400">Module Finance DEM-DEM</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1A1A1B]/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <Lock className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Accès Financier Sécurisé</h1>
            <p className="text-gray-400 text-sm">Module Finance • DEM-DEM Express</p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <p className="text-yellow-400 text-sm text-center">
              🔒 Connexion requise pour accéder aux données financières
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/login?redirectTo=/admin/finance/voyage')}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Se connecter pour accéder aux finances
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied || user.id !== SUPER_ADMIN_UID) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1A1A1B]/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
            <p className="text-gray-400 text-sm">Module Finance • DEM-DEM Express</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <p className="text-red-400 font-medium text-center mb-3">
              ⛔ Accès non autorisé
            </p>
            <p className="text-gray-400 text-sm text-center mb-4">
              Ce module est réservé exclusivement au Super Administrateur.
            </p>
            <div className="bg-black/40 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Votre UID :</p>
              <p className="text-gray-300 text-sm font-mono break-all">{user.id}</p>
            </div>
            <div className="bg-black/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">UID requis :</p>
              <p className="text-green-400 text-sm font-mono break-all">{SUPER_ADMIN_UID}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut size={18} />
              <span>Se déconnecter</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium rounded-lg transition-colors border border-gray-700"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (totalCommission / MONTHLY_TARGET) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Lock className="text-red-500" size={32} />
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Finance Voyage</h1>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">
                SUPER ADMIN ONLY
              </span>
            </div>
            <p className="text-gray-400 text-sm">DEM-DEM Express • Module Financier Sécurisé</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center space-x-2">
              <Timer className="text-yellow-400" size={16} />
              <span className="text-yellow-400 text-sm font-medium">Payout 20h00 dans {timeUntil8PM}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors border border-gray-700"
            >
              <RefreshCw size={16} />
              <span className="text-sm font-medium">Actualiser</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Filtres Temporels */}
        <div className="mb-6 flex items-center space-x-3">
          <Filter className="text-gray-400" size={20} />
          <span className="text-gray-400 text-sm font-medium">Période :</span>
          <div className="flex space-x-2">
            {[
              { value: 'today' as TimeFilter, label: 'Aujourd\'hui' },
              { value: '7days' as TimeFilter, label: '7 derniers jours' },
              { value: 'month' as TimeFilter, label: 'Mois en cours' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === filter.value
                    ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-6 border border-[#10B981]/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="text-white" size={24} />
                <span className="text-white/80 text-sm font-medium uppercase">CA Total Brut</span>
              </div>
            </div>
            <div className="text-4xl font-black text-white mb-2">
              {(totalRevenue / 1000).toFixed(1)}k FCFA
            </div>
            <div className="text-green-100 text-sm">Chiffre d'affaires global</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 border border-blue-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-white" size={24} />
                <span className="text-white/80 text-sm font-medium uppercase">Commission DEM-DEM</span>
              </div>
            </div>
            <div className="text-4xl font-black text-white mb-2">
              {(totalCommission / 1000).toFixed(1)}k FCFA
            </div>
            <div className="text-blue-100 text-sm mb-3">5% du chiffre d'affaires</div>

            {/* Barre de progression objectif */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-200 flex items-center gap-1">
                  <Target size={12} />
                  Objectif mensuel
                </span>
                <span className="text-white font-bold">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-blue-900/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-white to-blue-200 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-200">0 FCFA</span>
                <span className="text-white font-bold">{(MONTHLY_TARGET / 1000).toFixed(0)}k FCFA</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-2xl p-6 border border-yellow-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="text-white" size={24} />
                <span className="text-white/80 text-sm font-medium uppercase">Encours Séquestre</span>
              </div>
            </div>
            <div className="text-4xl font-black text-white mb-2">
              {(encoursSéquestre / 1000).toFixed(1)}k FCFA
            </div>
            <div className="text-yellow-100 text-sm">95% en attente de versement</div>
          </div>
        </div>

        {/* Graphique CA 7 jours */}
        <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-[#10B981]" size={24} />
              <h2 className="text-xl font-black text-white uppercase">Évolution CA - 7 derniers jours</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A1B', border: '1px solid #10B981', borderRadius: '8px' }}
                labelStyle={{ color: '#10B981' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Versements Chauffeurs */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Bus className="text-[#10B981]" size={24} />
                    <h2 className="text-xl font-black text-white uppercase">Versements Chauffeurs</h2>
                  </div>
                  <p className="text-gray-400 text-sm">Gestion des payouts (95% du CA)</p>
                </div>
                {payoutPreview.length > 0 && (
                  <button
                    onClick={() => setShowPayoutPreview(true)}
                    className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg flex items-center space-x-2 transition-all"
                  >
                    <Download size={16} />
                    <span className="text-sm font-medium">Rapport 20h</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-12 h-12 border-4 border-gray-700 border-t-[#10B981] rounded-full animate-spin"></div>
                </div>
              ) : filteredTrips.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="inline-block text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">Aucun trajet pour cette période</p>
                </div>
              ) : (
                filteredTrips.map(trip => (
                  <div
                    key={trip.id}
                    className={`bg-[#2A2A2A] rounded-xl p-4 border transition-all hover:shadow-lg ${
                      trip.status === 'ALERTE'
                        ? 'border-red-500/50 bg-red-500/5'
                        : trip.status === 'PRÊT_POUR_PAYOUT'
                        ? 'border-yellow-500/50'
                        : trip.status === 'VERSÉ'
                        ? 'border-green-500/50'
                        : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-white font-bold">{trip.driver_name}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            trip.service_type === 'EXPRESS'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>
                            {trip.service_type === 'EXPRESS' ? 'Express' : 'Allo Dakar'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">{trip.route}</p>
                        <p className="text-gray-500 text-xs">{trip.driver_phone}</p>
                      </div>
                      {trip.status === 'ALERTE' && (
                        <Bell className="text-red-500 animate-pulse" size={20} />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Chauffeur (95%)</p>
                        <p className="text-[#10B981] font-bold">{trip.driver_amount.toFixed(0)} FCFA</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Commission (5%)</p>
                        <p className="text-blue-400 font-bold">{trip.commission_amount.toFixed(0)} FCFA</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <span className={`text-xs font-bold uppercase flex items-center space-x-1 ${
                        trip.status === 'VERSÉ' ? 'text-green-400' :
                        trip.status === 'PRÊT_POUR_PAYOUT' ? 'text-yellow-400' :
                        trip.status === 'ALERTE' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {trip.status === 'VERSÉ' && <CheckCircle size={14} />}
                        {trip.status === 'ALERTE' && <AlertTriangle size={14} />}
                        {trip.status === 'PRÊT_POUR_PAYOUT' && <Clock size={14} />}
                        <span>{trip.status.replace('_', ' ')}</span>
                      </span>

                      {trip.status === 'PRÊT_POUR_PAYOUT' && (
                        <button
                          onClick={() => handleAuthorizePayout(trip.id, trip)}
                          className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg transition-all"
                        >
                          Autoriser Payout
                        </button>
                      )}

                      {trip.status === 'VERSÉ' && trip.paid_at && (
                        <span className="text-xs text-gray-500">
                          Payé le {new Date(trip.paid_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    {trip.status === 'ALERTE' && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-xs font-medium">
                          ⚠️ Aucun scan d'arrivée depuis plus de 12h
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Flux Abonnements */}
          <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="text-blue-500" size={24} />
                <h2 className="text-xl font-black text-white uppercase">Flux Abonnements</h2>
              </div>
              <p className="text-gray-400 text-sm mt-1">Transactions Express & Pass</p>
            </div>

            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="inline-block text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">Aucune transaction pour cette période</p>
                </div>
              ) : (
                filteredSubscriptions.slice(0, 20).map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedTransaction(sub)}
                    className="w-full bg-[#2A2A2A] rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white font-bold group-hover:text-blue-400 transition-colors">
                          {sub.user_name || 'Utilisateur'}
                        </p>
                        <p className="text-gray-500 text-xs">{sub.phone}</p>
                      </div>
                      <ChevronRight className="text-gray-600 group-hover:text-blue-400 transition-colors" size={20} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/30">
                        {sub.subscription_type || sub.pass_type || 'Pass'}
                      </span>
                      <span className="text-[#10B981] font-bold">{sub.amount} FCFA</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">
                        {new Date(sub.created_at).toLocaleString('fr-FR')}
                      </span>
                      <span className={`text-xs font-bold ${
                        sub.status === 'completed' ? 'text-green-400' :
                        sub.status === 'pending' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {sub.status === 'completed' ? '✓ Complété' :
                         sub.status === 'pending' ? '⏳ En attente' :
                         '✗ Échoué'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Toast Notifications */}
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl flex items-center space-x-3 min-w-[300px] ${
                toast.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                  : toast.type === 'error'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              }`}
            >
              {toast.type === 'loading' && (
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span className="flex-1 font-medium">{toast.message}</span>
              <button
                onClick={() => hideToast(toast.id)}
                className="text-current hover:opacity-70 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Modal Détails Transaction */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1B] rounded-2xl border border-blue-500/30 max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">Détails Transaction</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">Nom</p>
                  <p className="text-white font-bold">{selectedTransaction.user_name || 'Non renseigné'}</p>
                </div>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">Téléphone</p>
                  <p className="text-white font-bold">{selectedTransaction.phone}</p>
                </div>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">Type de Pass</p>
                  <p className="text-blue-400 font-bold">{selectedTransaction.subscription_type || selectedTransaction.pass_type || 'Standard'}</p>
                </div>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">Montant</p>
                  <p className="text-[#10B981] text-2xl font-black">{selectedTransaction.amount} FCFA</p>
                </div>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">ID Transaction PayDunya</p>
                  <p className="text-gray-300 font-mono text-sm break-all">{selectedTransaction.transaction_id || selectedTransaction.payment_reference || 'Non disponible'}</p>
                </div>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">Méthode de paiement</p>
                  <p className="text-white font-bold">{selectedTransaction.payment_method || 'Wave/Orange Money'}</p>
                </div>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">Date exacte</p>
                  <p className="text-white font-bold">{new Date(selectedTransaction.created_at).toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'medium'
                  })}</p>
                </div>

                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-500 text-xs mb-1">Statut</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    selectedTransaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    selectedTransaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedTransaction.status === 'completed' ? '✓ Complété' :
                     selectedTransaction.status === 'pending' ? '⏳ En attente' :
                     '✗ Échoué'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Modal Prévisualisation Mass Pay */}
        {showPayoutPreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1B] rounded-2xl border border-[#10B981]/30 max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white">Rapport Mass Pay - 20h00</h3>
                  <p className="text-gray-400 text-sm mt-1">Prévisualisation des versements PayTech</p>
                </div>
                <button
                  onClick={() => setShowPayoutPreview(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 font-bold mb-1">Total des versements</p>
                    <p className="text-white text-3xl font-black">
                      {(payoutPreview.reduce((sum, p) => sum + p.total_amount, 0) / 1000).toFixed(1)}k FCFA
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Nombre de chauffeurs</p>
                    <p className="text-white text-2xl font-black">{payoutPreview.length}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {payoutPreview.map((payout, idx) => (
                  <div key={idx} className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white font-bold">{payout.driver_name}</p>
                        <p className="text-gray-500 text-sm">{payout.driver_phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#10B981] text-xl font-black">{Math.round(payout.total_amount)} FCFA</p>
                        <p className="text-gray-400 text-xs">{payout.trips_count} trajet{payout.trips_count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={generateMassPayJSON}
                  className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Download size={20} />
                  <span>Télécharger JSON PayTech</span>
                </button>
                <button
                  onClick={() => setShowPayoutPreview(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFinanceVoyagePage;
