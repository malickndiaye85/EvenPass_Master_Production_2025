import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bus, MapPin, Calendar, User, Phone, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { db } from '../../firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { calculateCommissions } from '../../lib/passCommissions';

interface Route {
  id: string;
  departure_city: string;
  arrival_city: string;
  base_price: number;
  distance_km: number;
  estimated_duration_hours: number;
}

interface Schedule {
  id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  bus_type: string;
}

const InterregionalBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [routeId, setRouteId] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [passengersCount, setPassengersCount] = useState(1);
  const [passengerName, setPassengerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [routes, setRoutes] = useState<Route[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const routesRef = ref(db, 'pass/interregional/routes');
    onValue(routesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const routesArray: Route[] = Object.keys(data).map((key) => ({
          id: key,
          departure_city: data[key].from,
          arrival_city: data[key].to,
          base_price: data[key].price,
          distance_km: data[key].distance,
          estimated_duration_hours: data[key].duration
        }));
        setRoutes(routesArray);
      }
    });
  }, []);

  useEffect(() => {
    if (routeId) {
      setScheduleId('');
      setSchedules([]);
    }
  }, [routeId]);

  const fetchRoutes = async () => {
    const { data } = await supabase
      .from('interregional_routes')
      .select('*')
      .eq('active', true)
      .order('departure_city');
    if (data) setRoutes(data);
  };

  const fetchSchedules = async (rId: string) => {
    const { data } = await supabase
      .from('interregional_schedules')
      .select('*')
      .eq('route_id', rId)
      .eq('active', true)
      .gte('departure_date', new Date().toISOString().split('T')[0])
      .order('departure_date');
    if (data) setSchedules(data);
  };

  const selectedRoute = routes.find(r => r.id === routeId);
  const selectedSchedule = schedules.find(s => s.id === scheduleId);

  const calculateTotal = (): number => {
    return (selectedRoute?.base_price || 0) * passengersCount;
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!routeId;
      case 2: return !!scheduleId;
      case 3: return passengersCount > 0;
      case 4: return !!passengerName && phoneNumber.length >= 9;
      default: return false;
    }
  };

  const handleBooking = async () => {
    setLoading(true);

    const bookingData = {
      booking_reference: `BUS-${Date.now()}`,
      schedule_id: scheduleId,
      route_id: routeId,
      departure_city: selectedRoute?.departure_city || '',
      arrival_city: selectedRoute?.arrival_city || '',
      departure_date: selectedSchedule?.departure_date || '',
      departure_time: selectedSchedule?.departure_time || '',
      passenger_name: passengerName,
      phone_number: phoneNumber,
      passengers_count: passengersCount,
      unit_price: selectedRoute?.base_price || 0,
      total_amount: calculateTotal(),
      payment_status: 'pending'
    };

    const { data, error } = await supabase
      .from('interregional_bookings')
      .insert([bookingData])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert('Erreur lors de la réservation');
      return;
    }

    navigate('/pass/payment', {
      state: {
        bookingId: data.id,
        amount: calculateTotal(),
        service: 'INTER-RÉGIONAUX',
        reference: bookingData.booking_reference
      }
    });
  };

  const steps = [
    { number: 1, label: 'Route' },
    { number: 2, label: 'Date' },
    { number: 3, label: 'Passagers' },
    { number: 4, label: 'Contact' },
    { number: 5, label: 'Paiement' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" variant="default" />
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'mr-2' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s.number
                      ? isDark
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-600 text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-600'
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={`text-xs mt-1 hidden md:block ${
                    step >= s.number
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-8 ${
                    step > s.number
                      ? isDark ? 'bg-emerald-500' : 'bg-emerald-600'
                      : isDark ? 'bg-gray-800' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className={`rounded-3xl p-8 md:p-12 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            {step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <Bus className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Sélection de la route
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choisissez votre destination
                  </p>
                </div>

                <div className="space-y-3">
                  {routes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => { setRouteId(route.id); setStep(2); }}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left hover:scale-[1.02] ${
                        routeId === route.id
                          ? isDark
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-emerald-600 bg-emerald-50'
                          : isDark
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {route.departure_city} → {route.arrival_city}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {route.distance_km} km • ~{route.estimated_duration_hours}h
                          </div>
                        </div>
                        <div className={`text-2xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {route.base_price.toLocaleString()} F
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Horaire de départ
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedRoute?.departure_city} → {selectedRoute?.arrival_city}
                  </p>
                </div>

                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => setScheduleId(schedule.id)}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                        scheduleId === schedule.id
                          ? isDark
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-emerald-600 bg-emerald-50'
                          : isDark
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {new Date(schedule.departure_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </div>
                          <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Départ : {schedule.departure_time?.substring(0, 5)} • Arrivée : {schedule.arrival_time?.substring(0, 5)}
                          </div>
                          <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {schedule.available_seats} places disponibles
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {schedule.bus_type.toUpperCase()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <User className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Nombre de passagers
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Combien de places souhaitez-vous réserver ?
                  </p>
                </div>

                <div className={`p-8 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-center gap-8">
                    <button
                      onClick={() => setPassengersCount(Math.max(1, passengersCount - 1))}
                      className={`w-16 h-16 rounded-xl ${
                        isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-100'
                      } font-bold text-2xl shadow-lg transition-all`}
                    >
                      −
                    </button>
                    <span className={`text-5xl font-black w-24 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {passengersCount}
                    </span>
                    <button
                      onClick={() => setPassengersCount(Math.min(10, passengersCount + 1))}
                      className={`w-16 h-16 rounded-xl ${
                        isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-700'
                      } text-white font-bold text-2xl shadow-lg transition-all`}
                    >
                      +
                    </button>
                  </div>
                  <div className={`text-center mt-6 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {passengersCount} passager{passengersCount > 1 ? 's' : ''}
                  </div>
                </div>

                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="text-center mb-8">
                  <Phone className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Vos informations
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nom et téléphone
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Prénom et nom"
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-emerald-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+221 XX XXX XX XX"
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-emerald-500`}
                    />
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Votre ticket sera envoyé par SMS
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep(5)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'
                  }`}>
                    <Check className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Récapitulatif
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vérifiez vos informations
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedRoute?.departure_city} → {selectedRoute?.arrival_city}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedRoute?.distance_km} km • ~{selectedRoute?.estimated_duration_hours}h
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date et heure</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedSchedule && new Date(selectedSchedule.departure_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Départ à {selectedSchedule?.departure_time?.substring(0, 5)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Passagers</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {passengersCount} place{passengersCount > 1 ? 's' : ''}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {passengerName}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Contact</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {phoneNumber}
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${
                    isDark ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30' : 'bg-gradient-to-br from-emerald-50 to-teal-50'
                  }`}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>TOTAL À PAYER</div>
                    <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {calculateTotal().toLocaleString()} FCFA
                    </div>
                    <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      {selectedRoute?.base_price.toLocaleString()} F × {passengersCount}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isDark
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  }`}
                >
                  {loading ? 'Traitement...' : 'Acheter'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterregionalBookingPage;
