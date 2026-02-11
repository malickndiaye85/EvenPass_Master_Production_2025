import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  MapPin,
  DollarSign,
  TrendingUp,
  Power,
  AlertCircle,
  Plus,
  Navigation,
  LogOut,
  User,
  Phone,
  Home,
  List,
  Shield,
  ArrowRight,
  ChevronRight,
  Zap,
  Star,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { collection, doc, getDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase';

interface DriverProfile {
  uid: string;
  firstName?: string;
  lastName?: string;
  full_name?: string;
  phone: string;
  driver_license?: string;
  vehicle_insurance?: string;
  national_id?: string;
  vehicle_photo?: string;
  vehicle_type?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  plate_number?: string;
  seats?: number;
  status: 'pending' | 'pending_verification' | 'verified' | 'rejected' | 'suspended';
  verified: boolean;
  is_online?: boolean;
  created_at?: any;
  updated_at?: any;
  stats?: {
    total_trips: number;
    total_earnings: number;
    rating: number;
  };
}

interface Trip {
  id: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: any;
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'profile'>('home');

  useEffect(() => {
    console.log('[DRIVER DASHBOARD] 🔒 Accès Dashboard Chauffeur - Rôle actuel:', user?.role);
    console.log('[DRIVER DASHBOARD] 🔒 User:', user);
    console.log('[DRIVER DASHBOARD] 🔒 Auth loading:', authLoading);

    if (authLoading) {
      console.log('[DRIVER DASHBOARD] ⏳ Auth en cours de chargement...');
      return;
    }

    if (!user) {
      console.log('[DRIVER DASHBOARD] ❌ Pas d\'utilisateur, redirection vers login');
      navigate('/voyage/chauffeur/login');
      return;
    }

    if (user.role !== 'driver') {
      console.log('[DRIVER DASHBOARD] ⚠️ Utilisateur n\'est pas un chauffeur, rôle:', user.role);
      navigate('/voyage/chauffeur/login');
      return;
    }

    console.log('[DRIVER DASHBOARD] ✅ Utilisateur chauffeur authentifié, chargement des données...');
    loadDriverData();
  }, [user, authLoading, navigate]);

  const loadDriverData = async () => {
    if (!user) {
      console.error('[DRIVER DASHBOARD] Impossible de charger : pas d\'utilisateur');
      return;
    }

    try {
      console.log('[DRIVER DASHBOARD] Loading data for:', user.id);

      const driverRef = doc(firestore, 'drivers', user.id);
      const driverSnap = await getDoc(driverRef);

      if (!driverSnap.exists()) {
        console.log('[DRIVER DASHBOARD] No driver found, redirecting to signup');
        navigate('/voyage/chauffeur/signup');
        return;
      }

      const driverData = driverSnap.data() as DriverProfile;
      console.log('[DRIVER DASHBOARD] Driver loaded:', driverData);
      setDriver(driverData);

      const tripsRef = collection(firestore, 'trips');
      const tripsQuery = query(tripsRef, where('driverId', '==', user.id));
      const tripsSnap = await getDocs(tripsQuery);

      const tripsList: Trip[] = [];
      tripsSnap.forEach((doc) => {
        tripsList.push({ id: doc.id, ...doc.data() } as Trip);
      });

      tripsList.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      console.log('[DRIVER DASHBOARD] 🚗 Trajets trouvés dans Firestore:', tripsList.length);
      setTrips(tripsList);
    } catch (error) {
      console.error('[DRIVER DASHBOARD] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    if (!user || !driver) return;

    setSwitchLoading(true);
    try {
      const driverRef = doc(firestore, 'drivers', user.id);
      await updateDoc(driverRef, {
        is_online: !driver.is_online,
        updated_at: Timestamp.now()
      });

      setDriver({ ...driver, is_online: !driver.is_online });
      console.log('[DRIVER DASHBOARD] Online status toggled:', !driver.is_online);
    } catch (error) {
      console.error('[DRIVER DASHBOARD] Error toggling online status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (driver?.is_online) {
      alert('Veuillez passer en mode Offline avant de vous déconnecter');
      return;
    }

    try {
      await signOut();
      console.log('[DRIVER DASHBOARD] ✅ Déconnexion réussie');
      navigate('/voyage/chauffeur/login');
    } catch (error) {
      console.error('[DRIVER DASHBOARD] ❌ Erreur de déconnexion:', error);
      alert('Erreur lors de la déconnexion');
    }
  };

  const handlePublishTrip = () => {
    navigate('/voyage/chauffeur/publier-trajet');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFC700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  if (driver.status === 'pending' || driver.status === 'pending_verification' || driver.verified === false) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="bg-[#1A2332] rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="w-20 h-20 bg-[#FFC700]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-[#FFC700]" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 text-center">
            Validation en cours
          </h1>
          <p className="text-gray-400 mb-6 text-center">
            Votre profil est en cours de validation. Nous vous contacterons par WhatsApp sous 24-48h.
          </p>

          <div className="bg-gradient-to-r from-[#FFC700] to-[#FF8800] rounded-2xl p-6 text-[#0F1419] mb-6">
            <p className="text-sm font-medium mb-2">Téléphone de contact</p>
            <p className="text-2xl font-bold">{driver.phone}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-[#0F1419] rounded-xl">
              <div className="w-10 h-10 bg-[#10B981] rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Dossier soumis</p>
                <p className="text-xs text-gray-400">
                  {driver.created_at?.toDate ? new Date(driver.created_at.toDate()).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#0F1419] rounded-xl">
              <div className="w-10 h-10 bg-[#FFC700] rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#0F1419]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Vérification KYC</p>
                <p className="text-xs text-gray-400">En cours...</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#0F1419] rounded-xl">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Activation</p>
                <p className="text-xs text-gray-400">En attente</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Des questions ? WhatsApp : <span className="font-medium text-[#FFC700]">+221 77 123 45 67</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (driver.status === 'suspended' || driver.status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="bg-[#1A2332] rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 text-center">
            {driver.status === 'suspended' ? 'Compte suspendu' : 'Compte rejeté'}
          </h1>
          <p className="text-gray-400 mb-6 text-center">
            {driver.status === 'suspended'
              ? 'Votre compte a été temporairement suspendu. Veuillez contacter le support.'
              : 'Votre demande a été rejetée. Contactez le support pour plus d\'informations.'}
          </p>

          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <p className="text-sm text-red-400 text-center">
              Support : <span className="font-bold text-red-300">+221 77 123 45 67</span>
            </p>
          </div>

          <button
            onClick={() => navigate('/voyage')}
            className="w-full py-4 bg-gradient-to-r from-[#FFC700] to-[#FF8800] text-[#0F1419] rounded-2xl font-bold hover:shadow-lg transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const driverName = driver.full_name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
  const vehicleInfo = driver.vehicle_type || `${driver.vehicle_brand || ''} ${driver.vehicle_model || ''}`.trim();
  const activeTrips = trips.filter(t => t.status === 'active').length;
  const totalEarnings = driver.stats?.total_earnings || 0;
  const rating = driver.stats?.rating || 5.0;

  return (
    <div className="min-h-screen bg-[#0F1419] pb-24">
      {/* Header avec statut online/offline */}
      <div className="bg-[#1A2332] border-b border-gray-800 sticky top-0 z-40 shadow-lg">
        <div className="p-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-7 h-7 text-[#FFC700]" />
                DEM-DEM
              </h1>
              <p className="text-sm text-gray-400">Espace Chauffeur</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-3 bg-[#0F1419] rounded-xl hover:bg-[#0F1419]/70 transition-all"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-r from-[#FFC700] to-[#FF8800] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                  driver.is_online ? 'bg-[#10B981]' : 'bg-gray-600'
                }`}>
                  <Power className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-xl text-[#0F1419]">{driverName}</p>
                  <p className="text-sm text-[#0F1419]/70 font-medium">
                    {vehicleInfo || 'Véhicule non spécifié'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleOnline}
                disabled={switchLoading}
                className={`px-5 py-3 rounded-xl font-bold transition-all shadow-md ${
                  driver.is_online
                    ? 'bg-[#0F1419] text-[#FFC700]'
                    : 'bg-gray-600 text-white'
                } ${switchLoading ? 'opacity-50' : 'hover:scale-105'}`}
              >
                {driver.is_online ? 'EN LIGNE' : 'HORS LIGNE'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4">
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1A2332] rounded-2xl p-4 border border-gray-800">
                <div className="w-10 h-10 bg-[#FFC700]/20 rounded-xl flex items-center justify-center mb-3">
                  <Navigation className="w-5 h-5 text-[#FFC700]" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{activeTrips}</p>
                <p className="text-xs text-gray-400 font-medium">Trajets actifs</p>
              </div>

              <div className="bg-[#1A2332] rounded-2xl p-4 border border-gray-800">
                <div className="w-10 h-10 bg-[#10B981]/20 rounded-xl flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-[#10B981]" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{(totalEarnings / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-400 font-medium">Ce mois</p>
              </div>

              <div className="bg-[#1A2332] rounded-2xl p-4 border border-gray-800">
                <div className="w-10 h-10 bg-[#FF8800]/20 rounded-xl flex items-center justify-center mb-3">
                  <Star className="w-5 h-5 text-[#FF8800]" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{rating.toFixed(1)}</p>
                <p className="text-xs text-gray-400 font-medium">Note</p>
              </div>
            </div>

            {/* CTA Publier un trajet */}
            <button
              onClick={handlePublishTrip}
              className="w-full bg-gradient-to-r from-[#FFC700] to-[#FF8800] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#0F1419] rounded-2xl flex items-center justify-center">
                    <Plus className="w-8 h-8 text-[#FFC700]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xl text-[#0F1419]">Publier un trajet</p>
                    <p className="text-sm text-[#0F1419]/70 font-medium">Proposer un nouveau trajet</p>
                  </div>
                </div>
                <ArrowRight className="w-7 h-7 text-[#0F1419]" />
              </div>
            </button>

            {/* Mes trajets récents */}
            <div className="bg-[#1A2332] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="font-bold text-lg text-white">Mes trajets</h2>
                {trips.length > 3 && (
                  <button
                    onClick={() => setActiveTab('trips')}
                    className="text-sm text-[#FFC700] font-semibold hover:text-[#FF8800] transition-colors"
                  >
                    Voir tout
                  </button>
                )}
              </div>

              {trips.length === 0 ? (
                <div className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 mb-1 font-medium">Aucun trajet publié</p>
                  <p className="text-sm text-gray-500">Commencez à publier vos trajets</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {trips.slice(0, 3).map((trip) => (
                    <div key={trip.id} className="p-4 hover:bg-[#0F1419]/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-[#FFC700]" />
                            <p className="font-bold text-white">{trip.departure}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-400">{trip.destination}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          trip.status === 'active'
                            ? 'bg-[#10B981]/20 text-[#10B981]'
                            : trip.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {trip.status === 'active' ? 'ACTIF' : trip.status === 'completed' ? 'TERMINÉ' : 'ANNULÉ'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{trip.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{trip.availableSeats}/{trip.totalSeats}</span>
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#FFC700]">{trip.price.toLocaleString()} F</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conseil */}
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 rounded-2xl p-5 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Conseil du jour</p>
                  <p className="text-sm text-gray-300">
                    Publiez vos trajets la veille pour maximiser vos réservations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="space-y-4">
            <div className="bg-[#1A2332] rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="font-bold text-xl text-white">Tous mes trajets</h2>
              </div>

              {trips.length === 0 ? (
                <div className="p-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400 mb-6 text-lg font-medium">Aucun trajet publié</p>
                  <button
                    onClick={handlePublishTrip}
                    className="px-8 py-4 bg-gradient-to-r from-[#FFC700] to-[#FF8800] text-[#0F1419] rounded-2xl font-bold hover:shadow-lg transition-all"
                  >
                    Publier mon premier trajet
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {trips.map((trip) => (
                    <div key={trip.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-[#FFC700]" />
                            <p className="font-bold text-white">{trip.departure}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-400">{trip.destination}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          trip.status === 'active'
                            ? 'bg-[#10B981]/20 text-[#10B981]'
                            : trip.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {trip.status === 'active' ? 'ACTIF' : trip.status === 'completed' ? 'TERMINÉ' : 'ANNULÉ'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date</p>
                          <p className="text-sm font-semibold text-white">{trip.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Heure</p>
                          <p className="text-sm font-semibold text-white">{trip.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Prix</p>
                          <p className="text-sm font-semibold text-[#FFC700]">{trip.price.toLocaleString()} F</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Places</p>
                          <p className="text-sm font-semibold text-white">{trip.availableSeats}/{trip.totalSeats}</p>
                        </div>
                      </div>

                      {trip.status === 'active' && (
                        <button className="w-full py-3 border border-red-500/50 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/10 transition-all">
                          Annuler le trajet
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Informations personnelles */}
            <div className="bg-[#1A2332] rounded-2xl border border-gray-800 p-5">
              <h2 className="font-bold text-xl text-white mb-4">Informations personnelles</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nom complet</p>
                  <p className="font-semibold text-white text-lg">{driverName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                  <p className="font-semibold text-white text-lg">{driver.phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Note moyenne</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-lg">{rating.toFixed(1)}</p>
                    <Star className="w-5 h-5 text-[#FFC700] fill-current" />
                  </div>
                </div>
              </div>
            </div>

            {/* Informations véhicule */}
            <div className="bg-[#1A2332] rounded-2xl border border-gray-800 p-5">
              <h2 className="font-bold text-xl text-white mb-4">Mon véhicule</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Véhicule</p>
                  <p className="font-semibold text-white text-lg">
                    {vehicleInfo} {driver.vehicle_year ? `(${driver.vehicle_year})` : ''}
                  </p>
                </div>

                {driver.plate_number && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Immatriculation</p>
                    <p className="font-semibold text-white text-lg">{driver.plate_number}</p>
                  </div>
                )}

                {driver.seats && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Capacité</p>
                    <p className="font-semibold text-white text-lg">{driver.seats} places</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-[#1A2332] rounded-2xl border border-gray-800 p-5">
              <h2 className="font-bold text-xl text-white mb-4">Mes documents</h2>

              <div className="grid grid-cols-2 gap-3">
                {driver.driver_license && (
                  <a
                    href={driver.driver_license}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-[#0F1419] border border-gray-800 rounded-xl text-center hover:bg-[#0F1419]/70 transition-all"
                  >
                    <CheckCircle className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white">Permis</p>
                  </a>
                )}

                {driver.vehicle_insurance && (
                  <a
                    href={driver.vehicle_insurance}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-[#0F1419] border border-gray-800 rounded-xl text-center hover:bg-[#0F1419]/70 transition-all"
                  >
                    <CheckCircle className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white">Assurance</p>
                  </a>
                )}

                {driver.national_id && (
                  <a
                    href={driver.national_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-[#0F1419] border border-gray-800 rounded-xl text-center hover:bg-[#0F1419]/70 transition-all"
                  >
                    <CheckCircle className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white">Carte grise</p>
                  </a>
                )}

                {driver.vehicle_photo && (
                  <a
                    href={driver.vehicle_photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-[#0F1419] border border-gray-800 rounded-xl text-center hover:bg-[#0F1419]/70 transition-all"
                  >
                    <CheckCircle className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white">Photo véhicule</p>
                  </a>
                )}
              </div>
            </div>

            {/* Support */}
            <div className="bg-[#1A2332] rounded-2xl border border-gray-800 p-5">
              <h2 className="font-bold text-xl text-white mb-4">Support</h2>

              <a
                href="tel:+221771234567"
                className="flex items-center gap-4 p-4 bg-[#0F1419] border border-gray-800 rounded-xl hover:bg-[#0F1419]/70 transition-all"
              >
                <div className="w-12 h-12 bg-[#10B981]/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Contacter le support</p>
                  <p className="text-sm text-gray-400">+221 77 123 45 67</p>
                </div>
              </a>
            </div>

            {/* Déconnexion */}
            <button
              onClick={handleSignOut}
              className="w-full py-5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl font-bold hover:bg-red-500/20 transition-all"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      {/* Navigation Bottom - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A2332] border-t border-gray-800 shadow-2xl z-50">
        <div className="grid grid-cols-3 p-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-4 rounded-xl transition-all ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-[#FFC700] to-[#FF8800] text-[#0F1419]'
                : 'text-gray-500 hover:bg-[#0F1419]'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-bold">Accueil</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex flex-col items-center gap-1 py-4 rounded-xl transition-all ${
              activeTab === 'trips'
                ? 'bg-gradient-to-r from-[#FFC700] to-[#FF8800] text-[#0F1419]'
                : 'text-gray-500 hover:bg-[#0F1419]'
            }`}
          >
            <List className="w-6 h-6" />
            <span className="text-xs font-bold">Trajets</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-4 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#FFC700] to-[#FF8800] text-[#0F1419]'
                : 'text-gray-500 hover:bg-[#0F1419]'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-bold">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
