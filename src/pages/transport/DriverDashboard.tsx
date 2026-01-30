import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Power,
  AlertCircle,
  Plus,
  Navigation,
  LogOut,
  User,
  Phone,
  FileText,
  Calendar,
  Car,
  Home,
  List,
  Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ref, get, update, onValue, off } from 'firebase/database';
import { db } from '../../firebase';

interface DriverProfile {
  uid: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseUrl: string;
  insuranceUrl: string;
  carteGriseUrl: string;
  vehiclePhotoUrl: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlateNumber: string;
  vehicleSeats: number;
  status: 'pending_verification' | 'verified' | 'rejected' | 'suspended';
  isOnline: boolean;
  createdAt: number;
  updatedAt: number;
  stats?: {
    totalRides: number;
    totalEarnings: number;
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
  createdAt: number;
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'profile'>('home');

  useEffect(() => {
    if (!user) {
      navigate('/transport/driver/login');
      return;
    }

    const driverRef = ref(db, `drivers/${user.uid}`);

    const unsubscribe = onValue(driverRef, (snapshot) => {
      if (snapshot.exists()) {
        const driverData = snapshot.val() as DriverProfile;
        setDriver(driverData);

        const tripsRef = ref(db, `trips/${user.uid}`);
        onValue(tripsRef, (tripsSnapshot) => {
          if (tripsSnapshot.exists()) {
            const tripsData = tripsSnapshot.val();
            const tripsList: Trip[] = [];

            for (const tripId in tripsData) {
              tripsList.push({ id: tripId, ...tripsData[tripId] });
            }

            tripsList.sort((a, b) => b.createdAt - a.createdAt);
            setTrips(tripsList);
          } else {
            setTrips([]);
          }
        });
      } else {
        navigate('/voyage/chauffeur/signup');
      }
      setLoading(false);
    });

    return () => {
      off(driverRef);
    };
  }, [user, navigate]);

  const handleToggleOnline = async () => {
    if (!user || !driver) return;

    setSwitchLoading(true);
    try {
      const driverRef = ref(db, `drivers/${user.uid}`);
      await update(driverRef, {
        isOnline: !driver.isOnline,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error toggling online status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (driver?.isOnline) {
      alert('Veuillez passer en mode Offline avant de vous déconnecter');
      return;
    }
    navigate('/transport/driver/login');
  };

  const handlePublishTrip = () => {
    navigate('/voyage/chauffeur/publier-trajet');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  if (driver.status === 'pending_verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-[#0A1628] mb-3">
            Validation en cours
          </h1>
          <p className="text-gray-600 mb-6">
            Votre profil est en cours de validation par Allo Dakar. Nous vous contacterons par WhatsApp sous 24-48h.
          </p>

          <div className="bg-gradient-to-r from-[#0A1628] to-[#10B981] rounded-xl p-6 text-white mb-6">
            <p className="text-sm font-medium mb-2">Téléphone de contact</p>
            <p className="text-lg font-bold">{driver.phone}</p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Dossier soumis</p>
                <p className="text-xs text-gray-500">
                  {new Date(driver.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Vérification KYC</p>
                <p className="text-xs text-gray-500">En cours...</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Activation</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Des questions ? WhatsApp : <span className="font-medium">+221 77 123 45 67</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (driver.status === 'suspended' || driver.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-[#0A1628] mb-3">
            {driver.status === 'suspended' ? 'Compte suspendu' : 'Compte rejeté'}
          </h1>
          <p className="text-gray-600 mb-6">
            {driver.status === 'suspended'
              ? 'Votre compte a été temporairement suspendu. Veuillez contacter le support.'
              : 'Votre demande a été rejetée. Contactez le support pour plus d\'informations.'}
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              Support : <span className="font-bold">+221 77 123 45 67</span>
            </p>
          </div>

          <button
            onClick={() => navigate('/voyage')}
            className="w-full py-3 bg-[#0A1628] text-white rounded-lg font-semibold hover:bg-[#0A1628]/90 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header avec disponibilité */}
      <div className="bg-gradient-to-r from-[#10B981] to-[#059669] text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Allo Dakar</h1>
            <p className="text-sm opacity-90">Espace Chauffeur</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                driver.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                <Power className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">{driver.firstName} {driver.lastName}</p>
                <p className="text-sm opacity-90">
                  {driver.vehicleBrand} {driver.vehicleModel}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={switchLoading}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                driver.isOnline
                  ? 'bg-white text-[#10B981]'
                  : 'bg-gray-600 text-white'
              } ${switchLoading ? 'opacity-50' : ''}`}
            >
              {driver.isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4">
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Trajets actifs</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'active').length}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Ce mois</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {driver.stats?.totalEarnings?.toLocaleString('fr-FR') || '0'} F
                </p>
              </div>
            </div>

            {/* Bouton de publication */}
            <button
              onClick={handlePublishTrip}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-xl p-6 shadow-lg flex items-center justify-between hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">Publier un trajet</p>
                  <p className="text-sm opacity-90">Proposer un nouveau trajet</p>
                </div>
              </div>
              <Navigation className="w-6 h-6" />
            </button>

            {/* Mes trajets récents */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-900">Mes trajets</h2>
                {trips.length > 3 && (
                  <button
                    onClick={() => setActiveTab('trips')}
                    className="text-sm text-[#10B981] font-medium"
                  >
                    Voir tout
                  </button>
                )}
              </div>

              {trips.length === 0 ? (
                <div className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">Aucun trajet publié</p>
                  <p className="text-sm text-gray-400">Cliquez sur "Publier un trajet" pour commencer</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trips.slice(0, 3).map((trip) => (
                    <div key={trip.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-[#10B981]" />
                            <p className="font-semibold text-gray-900">{trip.departure}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-600">{trip.destination}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          trip.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : trip.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {trip.status === 'active' ? 'Actif' : trip.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{trip.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{trip.availableSeats}/{trip.totalSeats}</span>
                          </div>
                        </div>
                        <p className="font-bold text-[#10B981]">{trip.price.toLocaleString()} F</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conseil du jour */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Conseil du jour</p>
                  <p className="text-sm text-blue-700">
                    Publiez vos trajets la veille pour maximiser vos réservations. Les passagers préfèrent réserver à l'avance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-lg text-gray-900">Tous mes trajets</h2>
              </div>

              {trips.length === 0 ? (
                <div className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Aucun trajet publié</p>
                  <button
                    onClick={handlePublishTrip}
                    className="px-6 py-3 bg-[#10B981] text-white rounded-lg font-semibold hover:bg-[#059669] transition"
                  >
                    Publier mon premier trajet
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trips.map((trip) => (
                    <div key={trip.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-[#10B981]" />
                            <p className="font-semibold text-gray-900">{trip.departure}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-600">{trip.destination}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          trip.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : trip.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {trip.status === 'active' ? 'Actif' : trip.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date</p>
                          <p className="text-sm font-medium text-gray-900">{trip.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Heure</p>
                          <p className="text-sm font-medium text-gray-900">{trip.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Prix</p>
                          <p className="text-sm font-medium text-[#10B981]">{trip.price.toLocaleString()} F</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Places disponibles</p>
                          <p className="text-sm font-medium text-gray-900">{trip.availableSeats}/{trip.totalSeats}</p>
                        </div>
                      </div>

                      {trip.status === 'active' && (
                        <button className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition">
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
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Informations personnelles</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nom complet</p>
                  <p className="font-medium text-gray-900">{driver.firstName} {driver.lastName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                  <p className="font-medium text-gray-900">{driver.phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Note moyenne</p>
                  <p className="font-medium text-gray-900">{driver.stats?.rating?.toFixed(1) || '5.0'} ⭐</p>
                </div>
              </div>
            </div>

            {/* Informations véhicule */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Mon véhicule</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Véhicule</p>
                  <p className="font-medium text-gray-900">{driver.vehicleBrand} {driver.vehicleModel} ({driver.vehicleYear})</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Immatriculation</p>
                  <p className="font-medium text-gray-900">{driver.vehiclePlateNumber}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Capacité</p>
                  <p className="font-medium text-gray-900">{driver.vehicleSeats} places</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Mes documents</h2>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={driver.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">Permis de conduire</p>
                </a>

                <a
                  href={driver.insuranceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">Assurance</p>
                </a>

                <a
                  href={driver.carteGriseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">Carte grise</p>
                </a>

                <a
                  href={driver.vehiclePhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700">Photo véhicule</p>
                </a>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Support</h2>

              <a
                href="tel:+221771234567"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Contacter le support</p>
                  <p className="text-sm text-gray-500">+221 77 123 45 67</p>
                </div>
              </a>
            </div>

            {/* Déconnexion */}
            <button
              onClick={handleSignOut}
              className="w-full py-4 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      {/* Navigation Bottom - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-3 gap-1 p-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-3 rounded-lg transition ${
              activeTab === 'home'
                ? 'bg-[#10B981] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Accueil</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex flex-col items-center gap-1 py-3 rounded-lg transition ${
              activeTab === 'trips'
                ? 'bg-[#10B981] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List className="w-6 h-6" />
            <span className="text-xs font-medium">Mes trajets</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-3 rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-[#10B981] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
