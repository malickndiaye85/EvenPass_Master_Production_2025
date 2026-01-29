import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, AlertCircle, CreditCard, Calendar } from 'lucide-react';
import { getRoutes, getPricing, createBusBooking } from '../../lib/transportFirebase';
import { BusRoute, PricingConfig, isComfortAvailable } from '../../types/transport';
import { useAuth } from '../../context/FirebaseAuthContext';
import DynamicLogo from '../../components/DynamicLogo';
import { Timestamp } from 'firebase/firestore';

export default function DemDemExpressPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [selectedTier, setSelectedTier] = useState<'eco' | 'comfort'>('eco');
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const comfortAvailable = isComfortAvailable();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [routesData, pricingData] = await Promise.all([
        getRoutes(),
        getPricing(),
      ]);

      setRoutes(routesData);
      setPricing(pricingData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleRouteSelect(route: BusRoute) {
    setSelectedRoute(route);
    setSelectedTier('eco');
    setSeats(1);
  }

  function handleTierSelect(tier: 'eco' | 'comfort') {
    if (tier === 'comfort' && !comfortAvailable) {
      return;
    }
    setSelectedTier(tier);
  }

  async function handleBooking() {
    if (!user || !selectedRoute) {
      navigate('/organizer/login');
      return;
    }

    if (selectedTier === 'comfort' && !comfortAvailable) {
      alert('Service Comfort non disponible entre 10h et 16h. Choisissez Eco ou revenez plus tard.');
      return;
    }

    setBooking(true);

    try {
      const price = selectedRoute.pricing[selectedTier] * seats;
      const qrCode = Math.random().toString(36).substr(2, 6).toUpperCase();

      const bookingId = await createBusBooking({
        userId: user.uid,
        routeId: selectedRoute.id,
        tier: selectedTier,
        departureTime: Timestamp.now(),
        seats,
        price,
        paymentMethod: 'wave',
        status: 'pending',
        qrCode,
      });

      if (bookingId) {
        navigate(`/payment/success?bookingId=${bookingId}`);
      } else {
        alert('Erreur lors de la réservation');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Erreur lors de la réservation');
    } finally {
      setBooking(false);
    }
  }

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
            <DynamicLogo size="md" mode="transport" />
            <button
              onClick={() => navigate('/voyage')}
              className="text-white hover:text-[#10B981] transition"
            >
              Retour
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-[#0A192F] mb-2">
              DemDem Express
            </h1>
            <p className="text-gray-600">
              Bus navettes confortables avec abonnements
            </p>
          </div>

          {!comfortAvailable && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-orange-900 mb-1">Service Comfort en pause</h3>
                  <p className="text-orange-800 text-sm">
                    Le service Comfort est disponible de 05h à 10h et de 16h à 22h.
                    Le service Eco reste disponible toute la journée.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!selectedRoute ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0A192F] mb-4">
                Choisissez votre ligne
              </h2>

              {routes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] border-2 border-transparent hover:border-[#10B981]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-[#10B981] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                          {route.routeNumber}
                        </div>
                        <h3 className="text-xl font-bold text-[#0A192F]">
                          {route.name}
                        </h3>
                      </div>

                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-[#10B981]" />
                          <span>{route.distance} km • {route.duration} minutes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-[#10B981]" />
                          <span>Premier départ: {route.schedule.eco.firstDeparture}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center space-x-4">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <span className="text-xs text-gray-600">Eco</span>
                          <p className="text-lg font-bold text-[#0A192F]">
                            {route.pricing.eco.toLocaleString()} FCFA
                          </p>
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <span className="text-xs text-gray-600">Comfort</span>
                          <p className="text-lg font-bold text-[#0A192F]">
                            {route.pricing.comfort.toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>
                    </div>

                    <Bus className="w-12 h-12 text-[#10B981]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <button
                onClick={() => setSelectedRoute(null)}
                className="text-gray-600 hover:text-[#0A192F] mb-6 font-semibold"
              >
                ← Changer de ligne
              </button>

              <h2 className="text-2xl font-bold text-[#0A192F] mb-6">
                {selectedRoute.name}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Choisissez votre confort
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleTierSelect('eco')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        selectedTier === 'eco'
                          ? 'border-[#10B981] bg-[#10B981]/10'
                          : 'border-gray-200 hover:border-[#10B981]'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-bold text-lg mb-2">Eco</p>
                        <p className="text-2xl font-black text-[#0A192F]">
                          {selectedRoute.pricing.eco.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">FCFA / place</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Disponible 24h/24
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTierSelect('comfort')}
                      disabled={!comfortAvailable}
                      className={`p-6 rounded-xl border-2 transition-all relative ${
                        selectedTier === 'comfort'
                          ? 'border-[#10B981] bg-[#10B981]/10'
                          : comfortAvailable
                          ? 'border-gray-200 hover:border-[#10B981]'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {!comfortAvailable && (
                        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600 rotate-[-15deg]">
                            NON DISPONIBLE<br/>10h - 16h
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-bold text-lg mb-2">Comfort</p>
                        <p className="text-2xl font-black text-[#0A192F]">
                          {selectedRoute.pricing.comfort.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">FCFA / place</p>
                        <p className="text-xs text-gray-500 mt-2">
                          05h-10h & 16h-22h
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nombre de places
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={seats}
                    onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Prix unitaire</span>
                    <span className="font-bold text-[#0A192F]">
                      {selectedRoute.pricing[selectedTier].toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Places</span>
                    <span className="font-bold text-[#0A192F]">× {seats}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-[#0A192F]">Total</span>
                      <span className="text-3xl font-black text-[#10B981]">
                        {(selectedRoute.pricing[selectedTier] * seats).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={booking || (selectedTier === 'comfort' && !comfortAvailable)}
                  className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0EA570] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {booking ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      <span>Réserver maintenant</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => navigate('/pass/subscriptions')}
                    className="text-[#10B981] hover:underline font-semibold flex items-center justify-center space-x-2 mx-auto"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Voir les abonnements</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
