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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <nav className="bg-blue-950/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/10">
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
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              DEM-DEM EXPRESS
            </h1>
            <p className="text-white/70 text-lg">
              Bus navettes confortables avec abonnements illimités
            </p>
          </div>

          {!comfortAvailable && (
            <div className="bg-orange-500/20 border-l-4 border-orange-400 p-6 mb-6 rounded-r-2xl backdrop-blur-sm">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white mb-1">Service Comfort en pause</h3>
                  <p className="text-white/80 text-sm">
                    Le service Comfort est disponible de 05h à 10h et de 16h à 22h.
                    Le service Eco reste disponible toute la journée.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!selectedRoute ? (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-white mb-4">
                Choisissez votre ligne
              </h2>

              {routes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-8 cursor-pointer hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] border-2 border-white/10 hover:border-amber-400/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-amber-400 text-blue-950 rounded-full w-12 h-12 flex items-center justify-center font-bold shadow-lg shadow-amber-400/50">
                          {route.routeNumber}
                        </div>
                        <h3 className="text-2xl font-bold text-white">
                          {route.name}
                        </h3>
                      </div>

                      <div className="space-y-2 text-white/70 mb-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5 text-amber-400" />
                          <span>{route.distance} km • {route.duration} minutes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-amber-400" />
                          <span>Premier départ: {route.schedule.eco.firstDeparture}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center space-x-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                          <span className="text-xs text-white/60">Eco</span>
                          <p className="text-xl font-bold text-white">
                            {route.pricing.eco.toLocaleString()} FCFA
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                          <span className="text-xs text-white/60">Comfort</span>
                          <p className="text-xl font-bold text-white">
                            {route.pricing.comfort.toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>
                    </div>

                    <Bus className="w-16 h-16 text-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-10 border-2 border-white/10">
              <button
                onClick={() => setSelectedRoute(null)}
                className="text-white/70 hover:text-white mb-6 font-semibold transition-colors"
              >
                ← Changer de ligne
              </button>

              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="bg-amber-400 text-blue-950 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                  {selectedRoute.routeNumber}
                </span>
                {selectedRoute.name}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-white mb-4">
                    Choisissez votre confort
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleTierSelect('eco')}
                      className={`p-8 rounded-3xl border-3 transition-all ${
                        selectedTier === 'eco'
                          ? 'border-[#10B981] bg-[#10B981]/20 shadow-lg shadow-[#10B981]/30'
                          : 'border-white/20 bg-white/5 hover:border-[#10B981]/50'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-bold text-xl mb-3 text-white">Eco</p>
                        <p className="text-4xl font-black text-white mb-2">
                          {selectedRoute.pricing.eco.toLocaleString()}
                        </p>
                        <p className="text-sm text-white/60 mb-3">FCFA / place</p>
                        <p className="text-xs text-[#10B981] font-semibold">
                          ✓ Disponible 24h/24
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTierSelect('comfort')}
                      disabled={!comfortAvailable}
                      className={`p-8 rounded-3xl border-3 transition-all relative ${
                        selectedTier === 'comfort'
                          ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/30'
                          : comfortAvailable
                          ? 'border-white/20 bg-white/5 hover:border-amber-400/50'
                          : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {!comfortAvailable && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-400 rotate-[-15deg] text-center">
                            NON DISPONIBLE<br/>10h - 16h
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-bold text-xl mb-3 text-white">Comfort</p>
                        <p className="text-4xl font-black text-white mb-2">
                          {selectedRoute.pricing.comfort.toLocaleString()}
                        </p>
                        <p className="text-sm text-white/60 mb-3">FCFA / place</p>
                        <p className="text-xs text-amber-400 font-semibold">
                          05h-10h & 16h-22h
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    Nombre de places
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={seats}
                    onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                    className="w-full border-2 border-white/20 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 text-white text-xl font-bold text-center focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/70">Prix unitaire</span>
                    <span className="font-bold text-white text-lg">
                      {selectedRoute.pricing[selectedTier].toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white/70">Places</span>
                    <span className="font-bold text-white text-lg">× {seats}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-white">Total</span>
                      <span className="text-4xl font-black text-amber-400">
                        {(selectedRoute.pricing[selectedTier] * seats).toLocaleString()} <span className="text-lg">FCFA</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={booking || (selectedTier === 'comfort' && !comfortAvailable)}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-blue-950 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                >
                  {booking ? (
                    <div className="w-6 h-6 border-3 border-blue-950 border-t-transparent rounded-full animate-spin"></div>
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
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center justify-center space-x-2 mx-auto transition-colors"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Voir les abonnements SAMA PASS</span>
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
