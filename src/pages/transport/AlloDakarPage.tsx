import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Search, Clock, Users, AlertCircle, Navigation, DollarSign, User, ArrowRight, X } from 'lucide-react';
import DynamicLogo from '../../components/DynamicLogo';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase';

type DayFilter = 'today' | 'tomorrow' | 'day2';

interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: string;
  createdAt: any;
}

interface TripModalData {
  isOpen: boolean;
  trip: Trip | null;
}

export default function AlloDakarPage() {
  const navigate = useNavigate();

  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayFilter>('today');
  const [searchSeats, setSearchSeats] = useState('1');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripModal, setTripModal] = useState<TripModalData>({
    isOpen: false,
    trip: null
  });

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchOrigin, searchDestination, selectedDay, searchSeats]);

  const loadTrips = async () => {
    try {
      console.log('[ALLO DAKAR] 🔄 Chargement des trajets depuis Firestore...');
      const tripsRef = collection(firestore, 'trips');

      const allTripsSnapshot = await getDocs(tripsRef);
      console.log('[ALLO DAKAR] 📊 Total trajets dans Firestore:', allTripsSnapshot.size);

      if (allTripsSnapshot.size > 0) {
        console.log('[ALLO DAKAR] 📋 Premier trajet (exemple):', allTripsSnapshot.docs[0].data());
      }

      const tripsQuery = query(tripsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(tripsQuery);

      const loadedTrips: Trip[] = [];
      snapshot.forEach((doc) => {
        const tripData = { id: doc.id, ...doc.data() } as Trip;
        loadedTrips.push(tripData);
      });

      loadedTrips.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('[ALLO DAKAR] 🚗 Trajets trouvés dans Firestore:', loadedTrips.length);
      if (loadedTrips.length > 0) {
        console.log('[ALLO DAKAR] 📝 Trajets actifs:', loadedTrips);
      }
      setTrips(loadedTrips);
    } catch (error) {
      console.error('[ALLO DAKAR] ❌ Erreur chargement trajets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateForFilter = (filter: DayFilter): Date => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    if (filter === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    } else if (filter === 'day2') {
      date.setDate(date.getDate() + 2);
    }
    return date;
  };

  const formatDayLabel = (filter: DayFilter): string => {
    const date = getDateForFilter(filter);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };

    if (filter === 'today') return 'Aujourd\'hui';
    if (filter === 'tomorrow') return 'Demain';
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatDateForComparison = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const filterTrips = () => {
    console.log('[ALLO DAKAR] 🔍 Début filtrage. Total trajets:', trips.length);
    let filtered = [...trips];

    const targetDate = getDateForFilter(selectedDay);
    const targetDateString = formatDateForComparison(targetDate.toISOString().split('T')[0]);
    console.log('[ALLO DAKAR] 📅 Date cible:', targetDateString);

    const beforeDateFilter = filtered.length;
    filtered = filtered.filter(trip => {
      const tripDateString = formatDateForComparison(trip.date);
      console.log('[ALLO DAKAR] Comparaison dates - Trajet:', tripDateString, 'Cible:', targetDateString, 'Match:', tripDateString === targetDateString);
      return tripDateString === targetDateString;
    });
    console.log('[ALLO DAKAR] 📅 Après filtre date:', filtered.length, '(avant:', beforeDateFilter, ')');

    if (searchOrigin.trim()) {
      const beforeOriginFilter = filtered.length;
      filtered = filtered.filter(trip =>
        trip.departure.toLowerCase().includes(searchOrigin.toLowerCase())
      );
      console.log('[ALLO DAKAR] 🚩 Après filtre départ:', filtered.length, '(avant:', beforeOriginFilter, ')');
    }

    if (searchDestination.trim()) {
      const beforeDestFilter = filtered.length;
      filtered = filtered.filter(trip =>
        trip.destination.toLowerCase().includes(searchDestination.toLowerCase())
      );
      console.log('[ALLO DAKAR] 🏁 Après filtre destination:', filtered.length, '(avant:', beforeDestFilter, ')');
    }

    const requestedSeats = parseInt(searchSeats);
    const beforeSeatsFilter = filtered.length;
    filtered = filtered.filter(trip => trip.availableSeats >= requestedSeats);
    console.log('[ALLO DAKAR] 💺 Après filtre places:', filtered.length, '(avant:', beforeSeatsFilter, ')');

    console.log('[ALLO DAKAR] ✅ Filtrage terminé. Résultat:', filtered.length, 'trajets');

    setFilteredTrips(filtered);
  };

  const handleSearch = () => {
    filterTrips();
  };

  const handleTripClick = (trip: Trip) => {
    setTripModal({
      isOpen: true,
      trip: trip
    });
  };

  const closeTripModal = () => {
    setTripModal({
      isOpen: false,
      trip: null
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <nav className="bg-blue-950/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <DynamicLogo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              ALLO DAKAR
            </h1>
            <p className="text-white/70 text-lg">
              Covoiturage entre villes avec remboursement automatique
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-6 md:p-8 mb-8 border-2 border-white/10">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
              Rechercher un trajet
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Départ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#10B981] w-5 h-5" />
                  <input
                    type="text"
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    placeholder="Ex: Dakar, Thiès, Mbour..."
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Arrivée
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="Ex: Dakar, Thiès, Mbour..."
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Quand partez-vous ?
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['today', 'tomorrow', 'day2'] as DayFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedDay(filter)}
                      className={`py-3 px-2 rounded-xl font-bold text-sm transition-all ${
                        selectedDay === filter
                          ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/50'
                          : 'bg-white/10 text-white/70 border-2 border-white/20 hover:border-[#10B981]/50'
                      }`}
                    >
                      {formatDayLabel(filter)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Nombre de places
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4'].map((seats) => (
                    <button
                      key={seats}
                      onClick={() => setSearchSeats(seats)}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        searchSeats === seats
                          ? 'bg-[#10B981] text-white shadow-lg'
                          : 'bg-white/10 text-white/70 border-2 border-white/20 hover:border-[#10B981]/50'
                      }`}
                    >
                      {seats}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Search className="w-5 h-5" />
                Rechercher des trajets
              </button>
            </div>
          </div>

          <div className="bg-[#10B981]/20 border-l-4 border-[#10B981] p-6 rounded-r-2xl backdrop-blur-sm mb-6">
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-[#10B981] mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-1">
                  {filteredTrips.length} trajet{filteredTrips.length > 1 ? 's' : ''} disponible{filteredTrips.length > 1 ? 's' : ''} pour {formatDayLabel(selectedDay)}
                </h3>
                <p className="text-white/80 text-sm">
                  Les trajets sont triés par heure de départ (le plus proche en premier).
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Chargement des trajets...</p>
            </div>
          ) : filteredTrips.length > 0 ? (
            <div className="space-y-3">
              {filteredTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleTripClick(trip)}
                  className="w-full bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-2xl p-5 border-2 border-gray-800 hover:border-[#10B981]/50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-left">
                        <div className="text-5xl font-black text-white mb-1">
                          {trip.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <User className="w-4 h-4" />
                          <span>{trip.driverName}</span>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-[#10B981]" />
                          <span className="text-lg font-bold text-white">{trip.departure}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-5 h-5 text-cyan-400" />
                          <span className="text-lg font-bold text-white">{trip.destination}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Users className="w-5 h-5" />
                          <span className="text-sm font-semibold">{trip.availableSeats} places</span>
                        </div>
                        <div className="text-4xl font-black text-[#10B981]">
                          {trip.price.toLocaleString()} F
                        </div>
                      </div>
                      <ArrowRight className="w-8 h-8 text-white/50" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 bg-blue-500/20 border-l-4 border-blue-400 p-6 rounded-r-2xl backdrop-blur-sm">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white mb-1">Aucun trajet disponible</h3>
                  <p className="text-white/80 text-sm">
                    Aucun trajet ne correspond à votre recherche. Modifiez vos critères ou revenez plus tard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {tripModal.isOpen && tripModal.trip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-3xl max-w-lg w-full p-8 border-2 border-[#10B981]/30 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Détails du trajet</h2>
              <button
                onClick={closeTripModal}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-[#10B981]/10 rounded-2xl p-5 border border-[#10B981]/30">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-6 h-6 text-[#10B981]" />
                  <div>
                    <p className="text-sm text-gray-400">Chauffeur</p>
                    <p className="text-lg font-bold text-white">{tripModal.trip.driverName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-[#10B981] mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Départ</p>
                    <p className="text-xl font-bold text-white">{tripModal.trip.departure}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-gray-500" />
                </div>

                <div className="flex items-start gap-3">
                  <Navigation className="w-6 h-6 text-cyan-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Destination</p>
                    <p className="text-xl font-bold text-white">{tripModal.trip.destination}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-400">Heure</p>
                  </div>
                  <p className="text-2xl font-black text-white">{tripModal.trip.time}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-400">Places</p>
                  </div>
                  <p className="text-2xl font-black text-white">{tripModal.trip.availableSeats}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#10B981]/20 to-[#059669]/20 rounded-2xl p-5 border border-[#10B981]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Prix par personne</p>
                    <p className="text-4xl font-black text-[#10B981]">
                      {tripModal.trip.price.toLocaleString()} F
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-[#10B981]/30" />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-400 mb-1">
                      Réservation disponible prochainement
                    </p>
                    <p className="text-xs text-gray-400">
                      La fonctionnalité de réservation sera activée très bientôt. Vous pourrez réserver et payer directement depuis l'application.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={closeTripModal}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all"
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
