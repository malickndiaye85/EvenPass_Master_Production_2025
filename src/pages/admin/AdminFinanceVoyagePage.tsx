import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Lock, CheckCircle, Clock, AlertTriangle,
  RefreshCw, LogOut, X, CreditCard, Bus, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../firebase';

interface Trip {
  id: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  route: string;
  departure_date: string;
  arrival_date?: string;
  status: 'EN_ROUTE' | 'ARRIVÉE_CONFIRMÉE' | 'VERSÉ';
  total_revenue: number;
  driver_amount: number;
  commission_amount: number;
  paid_at?: string;
  license_plate: string;
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
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'loading';
  message: string;
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

  const SUPER_ADMIN_UID = 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';

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
        const tripsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          driver_amount: data[key].total_revenue * 0.95,
          commission_amount: data[key].total_revenue * 0.05
        }));
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
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20);
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

  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.total_revenue || 0), 0);
  const totalCommission = totalRevenue * 0.05;
  const encoursSéquestre = trips
    .filter(trip => trip.status !== 'VERSÉ')
    .reduce((sum, trip) => sum + (trip.driver_amount || 0), 0);

  const showToast = (type: 'success' | 'error' | 'loading', message: string, duration: number = 3000) => {
    const id = toastIdCounter;
    setToastIdCounter(prev => prev + 1);

    const newToast: Toast = { id, type, message };
    setToasts(prev => [...prev, newToast]);

    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  };

  const hideToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAuthorizePayout = async (tripId: string, trip: Trip) => {
    if (trip.status !== 'ARRIVÉE_CONFIRMÉE') {
      showToast('error', '❌ Le trajet doit avoir le statut "ARRIVÉE CONFIRMÉE"');
      return;
    }

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

  if (authLoading) {
    console.log('[FINANCE PAGE] Auth loading...');
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
          <p className="text-gray-600 text-xs mt-2">Authentification en cours</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[FINANCE PAGE] No user - showing login prompt');
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
    console.log('[FINANCE PAGE] Access denied - showing error');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A1A1B] to-[#0A0A0B] p-4">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
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
            <div className="text-blue-100 text-sm">5% du chiffre d'affaires</div>
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <DollarSign className="text-[#10B981]" size={24} />
                <h2 className="text-xl font-black text-white uppercase">Versements Chauffeurs</h2>
              </div>
              <p className="text-gray-400 text-sm mt-1">Gestion des payouts (95% du CA)</p>
            </div>

            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-12 h-12 border-4 border-gray-700 border-t-[#10B981] rounded-full animate-spin"></div>
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="inline-block text-gray-600 mb-3" size={48} />
                  <p className="text-gray-500">Aucun trajet enregistré</p>
                </div>
              ) : (
                trips.map((trip) => (
                  <div key={trip.id} className="bg-[#2A2A2A] rounded-xl p-5 border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-white font-bold text-lg">{trip.vehicle_number}</div>
                        <div className="text-gray-400 text-sm">{trip.license_plate}</div>
                        <div className="text-gray-500 text-sm mt-1">{trip.driver_name} • {trip.driver_phone}</div>
                      </div>
                      <div className="text-right">
                        {trip.status === 'VERSÉ' ? (
                          <span className="px-3 py-1 bg-[#10B981]/20 text-[#10B981] rounded-full text-xs font-bold border border-[#10B981]/30 flex items-center space-x-1">
                            <CheckCircle size={12} />
                            <span>VERSÉ</span>
                          </span>
                        ) : trip.status === 'ARRIVÉE_CONFIRMÉE' ? (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
                            ARRIVÉE CONFIRMÉE
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold border border-yellow-500/30 flex items-center space-x-1">
                            <Clock size={12} />
                            <span>EN ROUTE</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Trajet:</span>
                        <span className="text-white font-medium">{trip.route}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Date départ:</span>
                        <span className="text-white font-medium">
                          {new Date(trip.departure_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1 uppercase">Montant Chauffeur (95%)</div>
                        <div className="text-2xl font-black text-[#10B981]">
                          {trip.driver_amount.toLocaleString()} F
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1 uppercase">Commission (5%)</div>
                        <div className="text-2xl font-black text-blue-400">
                          {trip.commission_amount.toLocaleString()} F
                        </div>
                      </div>
                    </div>

                    {trip.status === 'VERSÉ' && trip.paid_at && (
                      <div className="bg-[#10B981]/10 rounded-lg p-3 mb-4 border border-[#10B981]/20">
                        <div className="flex items-center space-x-2 text-[#10B981] text-sm">
                          <CheckCircle size={14} />
                          <span>Versé le {new Date(trip.paid_at).toLocaleDateString('fr-FR')} à {new Date(trip.paid_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleAuthorizePayout(trip.id, trip)}
                      disabled={trip.status !== 'ARRIVÉE_CONFIRMÉE'}
                      className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                        trip.status === 'ARRIVÉE_CONFIRMÉE'
                          ? 'bg-[#10B981] hover:bg-[#059669] text-white cursor-pointer'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                      title={trip.status !== 'ARRIVÉE_CONFIRMÉE' ? 'Le trajet doit avoir le statut "ARRIVÉE CONFIRMÉE"' : 'Autoriser le versement'}
                    >
                      {trip.status === 'VERSÉ' ? (
                        <>
                          <CheckCircle size={16} />
                          <span>Paiement Effectué</span>
                        </>
                      ) : (
                        <>
                          <DollarSign size={16} />
                          <span>Autoriser le Paiement</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="text-[#10B981]" size={24} />
                <h2 className="text-xl font-black text-white uppercase">Flux Abonnements Express</h2>
              </div>
              <p className="text-gray-400 text-sm mt-1">Transactions récentes</p>
            </div>

            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {subscriptionTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="inline-block text-gray-600 mb-3" size={48} />
                  <p className="text-gray-500">Aucune transaction</p>
                </div>
              ) : (
                subscriptionTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-bold">{transaction.user_name}</div>
                        <div className="text-gray-400 text-sm">{transaction.phone}</div>
                      </div>
                      <div className="text-right">
                        {transaction.status === 'completed' ? (
                          <span className="px-2 py-1 bg-[#10B981]/20 text-[#10B981] rounded text-xs font-bold border border-[#10B981]/30">
                            ✓ PAYÉ
                          </span>
                        ) : transaction.status === 'pending' ? (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold border border-yellow-500/30">
                            EN COURS
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30">
                            ÉCHEC
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs">Type:</span>
                        <span className="text-white text-sm font-medium">{transaction.subscription_type}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs">Montant:</span>
                        <span className="text-[#10B981] text-sm font-bold">{transaction.amount.toLocaleString()} F</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Paiement:</span>
                        <span className="text-white text-sm">{transaction.payment_method}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      <span className="text-gray-500 text-xs">Réf: {transaction.payment_reference}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-sm animate-slide-in-right ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-400 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 border-red-400 text-white'
                : 'bg-blue-500/90 border-blue-400 text-white'
            }`}
          >
            {toast.type === 'loading' && (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
            <span className="font-medium">{toast.message}</span>
            {toast.type !== 'loading' && (
              <button
                onClick={() => hideToast(toast.id)}
                className="ml-2 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFinanceVoyagePage;
