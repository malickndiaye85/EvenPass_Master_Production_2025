import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Search, Clock, Users, AlertCircle, Navigation, DollarSign, User, ArrowRight, X, Phone, CreditCard } from 'lucide-react';
import DynamicLogo from '../../components/DynamicLogo';
import { collection, query, where, getDocs, orderBy, Timestamp, addDoc } from 'firebase/firestore';
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

interface BookingModalData {
  isOpen: boolean;
  trip: Trip | null;
  step: 'details' | 'booking';
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
  const [bookingModal, setBookingModal] = useState<BookingModalData>({
    isOpen: false,
    trip: null,
    step: 'details'
  });

  const [bookingSeats, setBookingSeats] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    setBookingModal({
      isOpen: true,
      trip: trip,
      step: 'booking'
    });
    setBookingSeats(1);
    setPhoneNumber('');
  };

  const closeBookingModal = () => {
    setBookingModal({
      isOpen: false,
      trip: null,
      step: 'details'
    });
    setBookingSeats(1);
    setPhoneNumber('');
    setIsProcessing(false);
  };

  const handleBookingSubmit = async () => {
    if (!bookingModal.trip || !phoneNumber.trim()) {
      alert('Veuillez saisir votre numéro de téléphone');
      return;
    }

    if (bookingSeats > bookingModal.trip.availableSeats) {
      alert('Nombre de places non disponible');
      return;
    }

    setIsProcessing(true);

    try {
      const totalAmount = bookingModal.trip.price * bookingSeats;

      const bookingData = {
        tripId: bookingModal.trip.id,
        driverId: bookingModal.trip.driverId,
        driverName: bookingModal.trip.driverName,
        departure: bookingModal.trip.departure,
        destination: bookingModal.trip.destination,
        date: bookingModal.trip.date,
        time: bookingModal.trip.time,
        seats: bookingSeats,
        phoneNumber: phoneNumber,
        totalAmount: totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: Timestamp.now()
      };

      const bookingRef = await addDoc(collection(firestore, 'bookings'), bookingData);
      console.log('[ALLO DAKAR] Booking created:', bookingRef.id);

      console.log('[ALLO DAKAR] Simulating successful payment...');

      setTimeout(() => {
        navigate(`/voyage/allo-dakar/confirmation?booking=${bookingRef.id}`);
      }, 1000);

    } catch (error) {
      console.error('[ALLO DAKAR] Error creating booking:', error);
      alert('Erreur lors de la création de la réservation. Veuillez réessayer.');
      setIsProcessing(false);
    }
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
                  className="w-full bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-2xl p-4 md:p-5 border-2 border-gray-800 hover:border-[#10B981]/50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 md:gap-6 flex-1 min-w-0">
                        <div className="text-left flex-shrink-0">
                          <div className="text-3xl md:text-5xl font-black text-white mb-1">
                            {trip.time}
                          </div>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                            <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">{trip.driverName}</span>
                          </div>
                        </div>

                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#10B981] flex-shrink-0" />
                            <span className="text-base md:text-lg font-bold text-white truncate">{trip.departure}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 flex-shrink-0" />
                            <span className="text-base md:text-lg font-bold text-white truncate">{trip.destination}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                        <span className="text-sm md:text-base font-semibold text-gray-400">{trip.availableSeats} places</span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="text-2xl md:text-4xl font-black text-[#10B981]">
                          {trip.price.toLocaleString()} F
                        </div>
                        <div className="bg-[#10B981] text-white px-3 md:px-4 py-2 rounded-xl font-bold text-sm md:text-base flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="hidden md:inline">Acheter</span>
                        </div>
                      </div>
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

      {bookingModal.isOpen && bookingModal.trip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-3xl max-w-lg w-full p-6 md:p-8 border-2 border-[#10B981]/30 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black text-white">Réserver votre trajet</h2>
              <button
                onClick={closeBookingModal}
                disabled={isProcessing}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 rounded-2xl p-4 border border-[#10B981]/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#10B981]" />
                    <span className="text-lg font-bold text-white">{bookingModal.trip.departure}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-cyan-400" />
                    <span className="text-lg font-bold text-white">{bookingModal.trip.destination}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{bookingModal.trip.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{bookingModal.trip.driverName}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <label className="block text-sm font-bold text-white mb-3">
                  Nombre de places
                </label>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setBookingSeats(Math.max(1, bookingSeats - 1))}
                    disabled={bookingSeats <= 1 || isProcessing}
                    className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-black text-[#10B981]">{bookingSeats}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      sur {bookingModal.trip.availableSeats} disponibles
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingSeats(Math.min(bookingModal.trip.availableSeats, bookingSeats + 1))}
                    disabled={bookingSeats >= bookingModal.trip.availableSeats || isProcessing}
                    className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <label className="block text-sm font-bold text-white mb-3">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="77 123 45 67"
                    autoFocus
                    disabled={isProcessing}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg font-semibold placeholder-gray-500 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 transition-all disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Votre numéro pour recevoir votre billet
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#10B981]/20 to-[#059669]/20 rounded-2xl p-5 border border-[#10B981]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Montant total</p>
                    <p className="text-4xl font-black text-[#10B981]">
                      {(bookingModal.trip.price * bookingSeats).toLocaleString()} F
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {bookingSeats} × {bookingModal.trip.price.toLocaleString()} F
                    </p>
                  </div>
                  <CreditCard className="w-12 h-12 text-[#10B981]/30" />
                </div>
              </div>

              <button
                onClick={handleBookingSubmit}
                disabled={isProcessing || !phoneNumber.trim()}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    Acheter maintenant
                  </>
                )}
              </button>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400">
                    Paiement sécurisé via PayDunya. Vous recevrez votre QR Code Sama Pass immédiatement après le paiement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
