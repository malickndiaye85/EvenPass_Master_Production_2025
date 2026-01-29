import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, User, Star, Phone, Wallet, ArrowRight } from 'lucide-react';
import { getCarpoolRides, bookCarpoolRide, getUserWallet } from '../../lib/transportFirebase';
import { CarpoolRide, UserWallet as UserWalletType } from '../../types/transport';
import { useAuth } from '../../context/FirebaseAuthContext';
import DynamicLogo from '../../components/DynamicLogo';
import { Timestamp } from 'firebase/firestore';

export default function AlloDakarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [wallet, setWallet] = useState<UserWalletType | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);

  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const ridesData = await getCarpoolRides();
      setRides(ridesData);

      if (user) {
        const walletData = await getUserWallet(user.uid);
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBookRide(ride: CarpoolRide, seatsToBook: number) {
    if (!user) {
      navigate('/organizer/login');
      return;
    }

    if (!wallet || wallet.balance < ride.pricePerSeat * seatsToBook) {
      alert('Solde insuffisant. Veuillez recharger votre portefeuille.');
      navigate('/pass/wallet');
      return;
    }

    setBooking(ride.id);

    try {
      const totalPrice = ride.pricePerSeat * seatsToBook;

      const bookingId = await bookCarpoolRide({
        rideId: ride.id,
        passengerId: user.uid,
        passengerName: user.displayName || 'Utilisateur',
        passengerPhone: user.phoneNumber || '',
        seatsBooked: seatsToBook,
        totalPrice,
        paymentMethod: 'wallet',
        walletBalanceBefore: wallet.balance,
        walletBalanceAfter: wallet.balance - totalPrice,
        status: 'confirmed',
      });

      if (bookingId) {
        alert('Réservation confirmée! Vous recevrez les détails par SMS.');
        loadData();
      } else {
        alert('Erreur lors de la réservation');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Erreur lors de la réservation');
    } finally {
      setBooking(null);
    }
  }

  const filteredRides = rides.filter(ride => {
    if (searchOrigin && !ride.origin.name.toLowerCase().includes(searchOrigin.toLowerCase())) {
      return false;
    }
    if (searchDestination && !ride.destination.name.toLowerCase().includes(searchDestination.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-[#0A192F] shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" showText={true} />
            <div className="flex items-center space-x-4">
              {wallet && (
                <button
                  onClick={() => navigate('/pass/wallet')}
                  className="flex items-center space-x-2 bg-[#10B981] text-white px-4 py-2 rounded-lg hover:bg-[#0EA570] transition"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="font-semibold">{wallet.balance.toLocaleString()} FCFA</span>
                </button>
              )}
              <button
                onClick={() => navigate('/voyage')}
                className="text-white hover:text-[#10B981] transition"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-[#0A192F] mb-2">
              Allo Dakar
            </h1>
            <p className="text-gray-600">
              Covoiturage entre villes avec remboursement automatique
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-[#0A192F] mb-4">
              Rechercher un trajet
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Départ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#10B981] w-5 h-5" />
                  <input
                    type="text"
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    placeholder="Ex: Dakar, Thiès, Mbour..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Arrivée
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#10B981] w-5 h-5" />
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="Ex: Dakar, Thiès, Mbour..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#0A192F]">
              Trajets disponibles ({filteredRides.length})
            </h2>

            {filteredRides.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucun trajet disponible pour cette recherche
                </p>
              </div>
            ) : (
              filteredRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-[#10B981] text-white rounded-full w-12 h-12 flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-[#0A192F]">
                            {ride.driverName}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{ride.driverRating.toFixed(1)}</span>
                            <span>•</span>
                            <Phone className="w-4 h-4" />
                            <span>{ride.driverPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 flex-1">
                            <MapPin className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-500">Départ</p>
                              <p className="font-semibold text-[#0A192F]">
                                {ride.origin.name}
                              </p>
                            </div>
                          </div>

                          <ArrowRight className="w-5 h-5 text-gray-400" />

                          <div className="flex items-center space-x-2 flex-1">
                            <MapPin className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="text-sm text-gray-500">Arrivée</p>
                              <p className="font-semibold text-[#0A192F]">
                                {ride.destination.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div>
                            <Car className="w-4 h-4 inline mr-1" />
                            <span>{ride.vehicleInfo.model} • {ride.vehicleInfo.color}</span>
                          </div>
                          <div>
                            <span className="font-mono">{ride.vehicleInfo.plate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Prix par place</p>
                          <p className="text-2xl font-black text-[#10B981]">
                            {ride.pricePerSeat.toLocaleString()} FCFA
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-gray-600">Places disponibles</p>
                          <p className="text-2xl font-black text-[#0A192F]">
                            {ride.availableSeats}
                          </p>
                        </div>

                        <button
                          onClick={() => handleBookRide(ride, 1)}
                          disabled={booking === ride.id || ride.availableSeats === 0}
                          className="bg-[#10B981] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0EA570] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {booking === ride.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Réserver'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
