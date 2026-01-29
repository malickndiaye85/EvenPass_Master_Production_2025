import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Ship, CreditCard, Check, Plus, Minus, AlertCircle, Package, Car, User, Luggage } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import DynamicLogo from '../../components/DynamicLogo';
import { db } from '../../firebase';
import { ref, push, set } from 'firebase/database';

// Tarifs officiels COSAMA (résidents)
const OFFICIAL_TARIFS_RESIDENT = {
  cabin_2: 26500,
  cabin_4: 24500,
  cabin_8: 12500,
  pullman: 5000
};

// Tarifs non-résidents
const OFFICIAL_TARIFS_NON_RESIDENT = {
  cabin_2: 30900,
  cabin_4: 28900,
  cabin_8: 18900,
  pullman: 15900
};

// Horaires officiels
const DEPARTURES = {
  dakar_ziguinchor: { days: 'Mardi & Vendredi', checkin: '14h30 - 17h30', departure: '20h00', arrival: '10h00 (lendemain)', fretCheckin: '14h30 - 17h30' },
  ziguinchor_dakar: { days: 'Jeudi & Dimanche', checkin: '11h30 - 13h00', departure: '13h00', arrival: '07h00 (lendemain)', fretCheckin: '11h30 - 13h00' }
};

// Tarifs FRET
const FRET_TARIFS = {
  voiture: 63300,
  voiture_manutention: 10000,
  moto: 20000,
  moto_manutention: 10000,
  bagages_franchise: 20,
  bagages_aline_sitoe_rate: 150,
  bagages_autres_rate: 100,
  bagages_max: 200
};

const COSAMABookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [bookingType, setBookingType] = useState<'passenger' | 'fret' | null>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'dakar_ziguinchor' | 'ziguinchor_dakar'>('dakar_ziguinchor');
  const [isResident, setIsResident] = useState(true);
  const [accommodationType, setAccommodationType] = useState<'cabin_2' | 'cabin_4' | 'cabin_8' | 'pullman'>('cabin_4');
  const [passengersCount, setPassengersCount] = useState(1);
  const [passengers, setPassengers] = useState<Array<{ name: string; cni: string; passport: string }>>([{ name: '', cni: '', passport: '' }]);
  const [holderPhone, setHolderPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange'>('wave');
  const [loading, setLoading] = useState(false);

  const [fretVehicleType, setFretVehicleType] = useState<'voiture' | 'moto' | null>(null);
  const [fretBaggageWeight, setFretBaggageWeight] = useState(0);
  const [fretShipType, setFretShipType] = useState<'aline_sitoe' | 'aguene_diambogne'>('aline_sitoe');

  const getTarif = (cabin: 'cabin_2' | 'cabin_4' | 'cabin_8' | 'pullman'): number => {
    return isResident ? OFFICIAL_TARIFS_RESIDENT[cabin] : OFFICIAL_TARIFS_NON_RESIDENT[cabin];
  };

  const calculateTotal = (): number => {
    return getTarif(accommodationType) * passengersCount;
  };

  const getCabinLabel = (cabin: string): string => {
    const labels: Record<string, string> = {
      cabin_2: 'Cabine 2 places',
      cabin_4: 'Cabine 4 places',
      cabin_8: 'Cabine 8 places',
      pullman: 'Fauteuil Pullman'
    };
    return labels[cabin] || cabin;
  };

  const handlePassengerCountChange = (count: number) => {
    setPassengersCount(count);
    const newPassengers = Array(count).fill(null).map((_, i) => passengers[i] || { name: '', cni: '', passport: '' });
    setPassengers(newPassengers);
  };

  const updatePassenger = (index: number, field: 'name' | 'cni' | 'passport', value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const calculateFretTotal = (): number => {
    let total = 0;

    if (fretVehicleType === 'voiture') {
      total += FRET_TARIFS.voiture;
    } else if (fretVehicleType === 'moto') {
      total += FRET_TARIFS.moto;
    }

    if (fretBaggageWeight > FRET_TARIFS.bagages_franchise) {
      const excessWeight = fretBaggageWeight - FRET_TARIFS.bagages_franchise;
      const rate = fretShipType === 'aline_sitoe' ? FRET_TARIFS.bagages_aline_sitoe_rate : FRET_TARIFS.bagages_autres_rate;
      total += excessWeight * rate;
    }

    return total;
  };

  const canProceed = (): boolean => {
    if (bookingType === 'passenger') {
      switch (step) {
        case 0: return !!bookingType;
        case 1: return !!direction;
        case 2: return !!accommodationType;
        case 3: return passengers.every(p => p.name && (p.cni.length === 13 || p.passport.length >= 6)) && holderPhone.length >= 9;
        default: return false;
      }
    } else if (bookingType === 'fret') {
      switch (step) {
        case 0: return !!bookingType;
        case 1: return !!direction;
        case 2: return fretVehicleType !== null || fretBaggageWeight > 0;
        case 3: return holderPhone.length >= 9;
        default: return false;
      }
    }
    return false;
  };

  const handleBooking = async () => {
    setLoading(true);

    const reference = `COSAMA-${bookingType === 'fret' ? 'FRET' : 'PASS'}-${Date.now()}`;
    const bookingRef = ref(db, `pass/cosama/${bookingType === 'fret' ? 'fret' : 'bookings'}/${reference}`);

    let bookingData: any;
    let totalAmount: number;

    if (bookingType === 'passenger') {
      totalAmount = calculateTotal();
      bookingData = {
        reference,
        booking_type: 'passenger',
        direction: direction === 'dakar_ziguinchor' ? 'Dakar → Ziguinchor' : 'Ziguinchor → Dakar',
        is_resident: isResident,
        accommodation_type: accommodationType,
        passengers_count: passengersCount,
        passengers: passengers,
        holder_phone: holderPhone,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        payment_status: 'pending',
        created_at: Date.now()
      };
    } else {
      totalAmount = calculateFretTotal();
      bookingData = {
        reference,
        booking_type: 'fret',
        direction: direction === 'dakar_ziguinchor' ? 'Dakar → Ziguinchor' : 'Ziguinchor → Dakar',
        vehicle_type: fretVehicleType,
        baggage_weight: fretBaggageWeight,
        ship_type: fretShipType,
        holder_phone: holderPhone,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        payment_status: 'pending',
        created_at: Date.now()
      };
    }

    try {
      await set(bookingRef, bookingData);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const metadata = bookingType === 'passenger'
        ? {
            phone: holderPhone,
            direction: bookingData.direction,
            accommodation: accommodationType,
            passengers: passengersCount
          }
        : {
            phone: holderPhone,
            direction: bookingData.direction,
            vehicle: fretVehicleType || 'none',
            baggage: fretBaggageWeight
          };

      const response = await fetch(`${supabaseUrl}/functions/v1/pass-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'XOF',
          payment_method: paymentMethod === 'wave' ? 'wave' : 'orange_money',
          service: `cosama_${bookingType}`,
          reference,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setLoading(false);
      navigate(`/payment/error?service=cosama&message=${encodeURIComponent('Erreur lors de l\'initiation du paiement')}`);
    }
  };

  const getSteps = () => {
    if (bookingType === 'passenger') {
      return [
        { number: 0, label: 'Type' },
        { number: 1, label: 'Direction' },
        { number: 2, label: 'Hébergement' },
        { number: 3, label: 'Passagers' },
        { number: 4, label: 'Paiement' }
      ];
    } else if (bookingType === 'fret') {
      return [
        { number: 0, label: 'Type' },
        { number: 1, label: 'Direction' },
        { number: 2, label: 'Fret' },
        { number: 3, label: 'Contact' },
        { number: 4, label: 'Paiement' }
      ];
    }
    return [{ number: 0, label: 'Type' }];
  };

  const steps = getSteps();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <DynamicLogo />
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            {steps.map((s, index) => (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s.number
                      ? isDark
                        ? 'bg-cyan-500 text-white'
                        : 'bg-[#0A7EA3] text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-600'
                        : 'bg-gray-200 text-gray-400'
                  }`} style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}>
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={`text-xs mt-1 hidden md:block ${
                    step >= s.number
                      ? isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'
                      : isDark ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-12 ${
                    step > s.number
                      ? isDark ? 'bg-cyan-500' : 'bg-[#0A7EA3]'
                      : isDark ? 'bg-gray-800' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className={`p-8 md:p-12 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`} style={{ borderRadius: '50px 20px 50px 20px' }}>
            {step === 0 && (
              <div>
                <div className="text-center mb-8">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Type de réservation
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Passager ou Transport de marchandises
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={() => {
                      setBookingType('passenger');
                      setStep(1);
                    }}
                    className={`p-8 transition-all transform hover:scale-105 ${
                      isDark
                        ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-4 border-cyan-500 hover:border-cyan-400'
                        : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6] border-4 border-[#0A7EA3] hover:border-[#006B8C]'
                    }`}
                    style={{ borderRadius: '40px 15px 40px 15px' }}
                  >
                    <User className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                    <div className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      PASSAGER
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Réservez votre traversée
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Cabines & Pullman
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setBookingType('fret');
                      setStep(1);
                    }}
                    className={`p-8 transition-all transform hover:scale-105 ${
                      isDark
                        ? 'bg-gradient-to-br from-orange-900/40 to-amber-900/40 border-4 border-orange-500 hover:border-orange-400'
                        : 'bg-gradient-to-br from-orange-100 to-amber-100 border-4 border-orange-500 hover:border-orange-600'
                    }`}
                    style={{ borderRadius: '15px 40px 15px 40px' }}
                  >
                    <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    <div className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      FRET
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Véhicules & Bagages
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Transport de marchandises
                    </div>
                  </button>
                </div>
              </div>
            )}

            {bookingType === 'passenger' && step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Choisissez votre direction
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ferry Aline Sitoé Diatta
                  </p>
                </div>

                <div className="mb-6">
                  <div className={`p-4 mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '20px 8px 20px 8px' }}>
                    <div className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type de passager</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsResident(true)}
                        className={`py-3 px-4 font-bold transition-all ${
                          isResident
                            ? isDark ? 'bg-cyan-500 text-white' : 'bg-[#0A7EA3] text-white'
                            : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{ borderRadius: '15px 5px 15px 5px' }}
                      >
                        Résident
                      </button>
                      <button
                        onClick={() => setIsResident(false)}
                        className={`py-3 px-4 font-bold transition-all ${
                          !isResident
                            ? isDark ? 'bg-cyan-500 text-white' : 'bg-[#0A7EA3] text-white'
                            : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{ borderRadius: '5px 15px 5px 15px' }}
                      >
                        Non-résident
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={() => setDirection('dakar_ziguinchor')}
                    className={`p-6 transition-all ${
                      direction === 'dakar_ziguinchor'
                        ? isDark
                          ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-4 border-cyan-500'
                          : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6] border-4 border-[#0A7EA3]'
                        : isDark
                          ? 'bg-gray-700/50 border-2 border-gray-700 opacity-60'
                          : 'bg-gray-50 border-2 border-gray-300 opacity-60'
                    }`}
                    style={{ borderRadius: '40px 15px 40px 15px' }}
                  >
                    <div className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Dakar → Ziguinchor
                    </div>
                    <div className={`text-sm mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} font-bold`}>
                      {DEPARTURES.dakar_ziguinchor.days}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Embarquement : {DEPARTURES.dakar_ziguinchor.checkin}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Départ : {DEPARTURES.dakar_ziguinchor.departure}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Arrivée : {DEPARTURES.dakar_ziguinchor.arrival}
                    </div>
                  </button>

                  <button
                    onClick={() => setDirection('ziguinchor_dakar')}
                    className={`p-6 transition-all ${
                      direction === 'ziguinchor_dakar'
                        ? isDark
                          ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-4 border-cyan-500'
                          : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6] border-4 border-[#0A7EA3]'
                        : isDark
                          ? 'bg-gray-700/50 border-2 border-gray-700 opacity-60'
                          : 'bg-gray-50 border-2 border-gray-300 opacity-60'
                    }`}
                    style={{ borderRadius: '15px 40px 15px 40px' }}
                  >
                    <div className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Ziguinchor → Dakar
                    </div>
                    <div className={`text-sm mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} font-bold`}>
                      {DEPARTURES.ziguinchor_dakar.days}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Embarquement : {DEPARTURES.ziguinchor_dakar.checkin}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Départ : {DEPARTURES.ziguinchor_dakar.departure}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Arrivée : {DEPARTURES.ziguinchor_dakar.arrival}
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className={`w-full py-5 font-black text-xl text-white transition-all flex items-center justify-center gap-3 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  style={{ borderRadius: '25px 10px 25px 10px' }}
                >
                  Continuer
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {bookingType === 'passenger' && step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Type d'hébergement
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cabines ou Pullman
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setAccommodationType('cabin_2')}
                    className={`p-6 transition-all ${
                      accommodationType === 'cabin_2'
                        ? isDark ? 'bg-cyan-500/20 border-4 border-cyan-500' : 'bg-[#E6F1F5] border-4 border-[#0A7EA3]'
                        : isDark ? 'bg-gray-700/50 border-2 border-gray-700' : 'bg-gray-50 border-2 border-gray-300'
                    }`}
                    style={{ borderRadius: '30px 10px 30px 10px' }}
                  >
                    <div className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Cabine 2 places
                    </div>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {getTarif('cabin_2').toLocaleString()} FCFA
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Cabine privée • Confort optimal
                    </div>
                  </button>

                  <button
                    onClick={() => setAccommodationType('cabin_4')}
                    className={`p-6 transition-all ${
                      accommodationType === 'cabin_4'
                        ? isDark ? 'bg-cyan-500/20 border-4 border-cyan-500' : 'bg-[#E6F1F5] border-4 border-[#0A7EA3]'
                        : isDark ? 'bg-gray-700/50 border-2 border-gray-700' : 'bg-gray-50 border-2 border-gray-300'
                    }`}
                    style={{ borderRadius: '10px 30px 10px 30px' }}
                  >
                    <div className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Cabine 4 places
                    </div>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {getTarif('cabin_4').toLocaleString()} FCFA
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Cabine partagée • Rapport qualité/prix
                    </div>
                  </button>

                  <button
                    onClick={() => setAccommodationType('cabin_8')}
                    className={`p-6 transition-all ${
                      accommodationType === 'cabin_8'
                        ? isDark ? 'bg-cyan-500/20 border-4 border-cyan-500' : 'bg-[#E6F1F5] border-4 border-[#0A7EA3]'
                        : isDark ? 'bg-gray-700/50 border-2 border-gray-700' : 'bg-gray-50 border-2 border-gray-300'
                    }`}
                    style={{ borderRadius: '30px 10px 30px 10px' }}
                  >
                    <div className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Cabine 8 places
                    </div>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {getTarif('cabin_8').toLocaleString()} FCFA
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Dortoir • Prix économique
                    </div>
                  </button>

                  <button
                    onClick={() => setAccommodationType('pullman')}
                    className={`p-6 transition-all ${
                      accommodationType === 'pullman'
                        ? isDark ? 'bg-cyan-500/20 border-4 border-cyan-500' : 'bg-[#E6F1F5] border-4 border-[#0A7EA3]'
                        : isDark ? 'bg-gray-700/50 border-2 border-gray-700' : 'bg-gray-50 border-2 border-gray-300'
                    }`}
                    style={{ borderRadius: '10px 30px 10px 30px' }}
                  >
                    <div className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Fauteuil Pullman
                    </div>
                    <div className={`text-3xl font-black mb-1 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {getTarif('pullman').toLocaleString()} FCFA
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Siège inclinable • Climatisé
                    </div>
                  </button>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                  <div className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre de passagers
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => handlePassengerCountChange(Math.max(1, passengersCount - 1))}
                      className={`w-14 h-14 font-bold text-2xl transition-all ${
                        isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                      }`}
                      style={{ borderRadius: '15px 5px 15px 5px' }}
                    >
                      <Minus className="w-6 h-6 mx-auto" />
                    </button>
                    <span className={`text-5xl font-black w-24 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {passengersCount}
                    </span>
                    <button
                      onClick={() => handlePassengerCountChange(passengersCount + 1)}
                      className={`w-14 h-14 font-bold text-2xl text-white transition-all ${
                        isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#0A7EA3] hover:bg-[#006B8C]'
                      }`}
                      style={{ borderRadius: '5px 15px 5px 15px' }}
                    >
                      <Plus className="w-6 h-6 mx-auto" />
                    </button>
                  </div>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'}`} style={{ borderRadius: '30px 10px 30px 10px' }}>
                  <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>TOTAL À PAYER</div>
                  <div className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {calculateTotal().toLocaleString()} <span className="text-2xl">FCFA</span>
                  </div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {passengersCount} passager{passengersCount > 1 ? 's' : ''} • {getCabinLabel(accommodationType)}
                  </div>
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className={`w-full py-5 font-black text-xl text-white transition-all flex items-center justify-center gap-3 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  style={{ borderRadius: '25px 10px 25px 10px' }}
                >
                  Continuer
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {bookingType === 'passenger' && step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <CreditCard className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Informations passagers
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    CNI ou Passeport obligatoire pour chaque passager
                  </p>
                </div>

                <div className="space-y-6 mb-6">
                  {passengers.map((passenger, index) => (
                    <div key={index} className={`p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: index % 2 === 0 ? '30px 10px 30px 10px' : '10px 30px 10px 30px' }}>
                      <div className={`text-lg font-black mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                        Passager {index + 1}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Nom complet
                          </label>
                          <input
                            type="text"
                            value={passenger.name}
                            onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                            placeholder="Prénom et nom"
                            className={`w-full p-4 border-2 ${
                              isDark
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            } focus:outline-none focus:border-cyan-500`}
                            style={{ borderRadius: '15px 8px 15px 8px' }}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Numéro CNI {isResident && '(13 chiffres)'}
                            </label>
                            <input
                              type="text"
                              value={passenger.cni}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, '');
                                if (cleaned.length <= 13) {
                                  updatePassenger(index, 'cni', cleaned);
                                  if (cleaned.length > 0) {
                                    updatePassenger(index, 'passport', '');
                                  }
                                }
                              }}
                              onFocus={(e) => {
                                if (passenger.passport.length > 0) {
                                  updatePassenger(index, 'passport', '');
                                }
                              }}
                              placeholder="1234567890123"
                              maxLength={13}
                              className={`w-full p-4 font-mono border-2 ${
                                passenger.cni && passenger.cni.length !== 13 && passenger.passport.length === 0 ? 'border-red-500' :
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              } focus:outline-none focus:border-cyan-500`}
                              style={{ borderRadius: '8px 15px 8px 15px' }}
                            />
                            {passenger.cni && passenger.cni.length !== 13 && passenger.passport.length === 0 && (
                              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>13 chiffres requis ({passenger.cni.length}/13)</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Numéro de Passeport
                            </label>
                            <input
                              type="text"
                              value={passenger.passport}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                updatePassenger(index, 'passport', value);
                                if (value.length > 0) {
                                  updatePassenger(index, 'cni', '');
                                }
                              }}
                              onFocus={(e) => {
                                if (passenger.cni.length > 0) {
                                  updatePassenger(index, 'cni', '');
                                }
                              }}
                              placeholder="AB1234567"
                              className={`w-full p-4 font-mono uppercase border-2 ${
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              } focus:outline-none focus:border-cyan-500`}
                              style={{ borderRadius: '15px 8px 15px 8px' }}
                            />
                            {passenger.passport.length > 0 && passenger.passport.length < 6 && (
                              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Min. 6 caractères ({passenger.passport.length}/6)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`p-3 text-xs ${isDark ? 'bg-gray-700/30 text-gray-400' : 'bg-blue-50 text-blue-700'}`} style={{ borderRadius: '12px' }}>
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Renseignez soit votre CNI (résidents), soit votre Passeport (non-résidents)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Téléphone (pour recevoir les billets)
                  </label>
                  <input
                    type="tel"
                    value={holderPhone}
                    onChange={(e) => setHolderPhone(e.target.value)}
                    placeholder=""
                    className={`w-full p-5 text-xl font-bold border-2 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-cyan-500`}
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                  />
                </div>

                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceed()}
                  className={`w-full py-5 font-black text-xl text-white transition-all flex items-center justify-center gap-3 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  style={{ borderRadius: '25px 10px 25px 10px' }}
                >
                  Continuer
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {bookingType === 'fret' && step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Choisissez votre direction
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transport FRET - Ferry Aline Sitoé Diatta
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={() => setDirection('dakar_ziguinchor')}
                    className={`p-6 transition-all ${
                      direction === 'dakar_ziguinchor'
                        ? isDark
                          ? 'bg-gradient-to-br from-orange-900/40 to-amber-900/40 border-4 border-orange-500'
                          : 'bg-gradient-to-br from-orange-100 to-amber-100 border-4 border-orange-500'
                        : isDark
                          ? 'bg-gray-700/50 border-2 border-gray-700 opacity-60'
                          : 'bg-gray-50 border-2 border-gray-300 opacity-60'
                    }`}
                    style={{ borderRadius: '40px 15px 40px 15px' }}
                  >
                    <div className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Dakar → Ziguinchor
                    </div>
                    <div className={`text-sm mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'} font-bold`}>
                      {DEPARTURES.dakar_ziguinchor.days}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Enregistrement FRET : {DEPARTURES.dakar_ziguinchor.fretCheckin}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Départ : {DEPARTURES.dakar_ziguinchor.departure}
                    </div>
                  </button>

                  <button
                    onClick={() => setDirection('ziguinchor_dakar')}
                    className={`p-6 transition-all ${
                      direction === 'ziguinchor_dakar'
                        ? isDark
                          ? 'bg-gradient-to-br from-orange-900/40 to-amber-900/40 border-4 border-orange-500'
                          : 'bg-gradient-to-br from-orange-100 to-amber-100 border-4 border-orange-500'
                        : isDark
                          ? 'bg-gray-700/50 border-2 border-gray-700 opacity-60'
                          : 'bg-gray-50 border-2 border-gray-300 opacity-60'
                    }`}
                    style={{ borderRadius: '15px 40px 15px 40px' }}
                  >
                    <div className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Ziguinchor → Dakar
                    </div>
                    <div className={`text-sm mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'} font-bold`}>
                      {DEPARTURES.ziguinchor_dakar.days}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Enregistrement FRET : {DEPARTURES.ziguinchor_dakar.fretCheckin}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Départ : {DEPARTURES.ziguinchor_dakar.departure}
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className={`w-full py-5 font-black text-xl text-white transition-all flex items-center justify-center gap-3 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                        : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  style={{ borderRadius: '25px 10px 25px 10px' }}
                >
                  Continuer
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {bookingType === 'fret' && step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Transport FRET
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Véhicules et bagages supplémentaires
                  </p>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                  <div className={`text-lg font-black mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    VÉHICULES
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setFretVehicleType(fretVehicleType === 'voiture' ? null : 'voiture')}
                      className={`p-6 transition-all ${
                        fretVehicleType === 'voiture'
                          ? isDark ? 'bg-orange-500/20 border-4 border-orange-500' : 'bg-orange-100 border-4 border-orange-500'
                          : isDark ? 'bg-gray-700/50 border-2 border-gray-700' : 'bg-white border-2 border-gray-300'
                      }`}
                      style={{ borderRadius: '30px 10px 30px 10px' }}
                    >
                      <Car className={`w-12 h-12 mx-auto mb-3 ${fretVehicleType === 'voiture' ? isDark ? 'text-orange-400' : 'text-orange-600' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <div className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Voiture
                      </div>
                      <div className={`text-3xl font-black mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                        {FRET_TARIFS.voiture.toLocaleString()} FCFA
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Inclut {FRET_TARIFS.voiture_manutention.toLocaleString()} FCFA de manutention
                      </div>
                    </button>

                    <button
                      onClick={() => setFretVehicleType(fretVehicleType === 'moto' ? null : 'moto')}
                      className={`p-6 transition-all ${
                        fretVehicleType === 'moto'
                          ? isDark ? 'bg-orange-500/20 border-4 border-orange-500' : 'bg-orange-100 border-4 border-orange-500'
                          : isDark ? 'bg-gray-700/50 border-2 border-gray-700' : 'bg-white border-2 border-gray-300'
                      }`}
                      style={{ borderRadius: '10px 30px 10px 30px' }}
                    >
                      <div className="text-4xl mb-3">🏍️</div>
                      <div className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Moto
                      </div>
                      <div className={`text-3xl font-black mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                        {FRET_TARIFS.moto.toLocaleString()} FCFA
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Inclut {FRET_TARIFS.moto_manutention.toLocaleString()} FCFA de manutention
                      </div>
                    </button>
                  </div>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                  <div className={`text-lg font-black mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    BAGAGES SUPPLÉMENTAIRES
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Type de ferry
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFretShipType('aline_sitoe')}
                        className={`py-3 px-4 font-bold transition-all ${
                          fretShipType === 'aline_sitoe'
                            ? isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white'
                            : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{ borderRadius: '15px 5px 15px 5px' }}
                      >
                        Aline Sitoé Diatta
                      </button>
                      <button
                        onClick={() => setFretShipType('aguene_diambogne')}
                        className={`py-3 px-4 font-bold transition-all ${
                          fretShipType === 'aguene_diambogne'
                            ? isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white'
                            : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{ borderRadius: '5px 15px 5px 15px' }}
                      >
                        Aguene/Diambogne
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Poids total des bagages (kg)
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setFretBaggageWeight(Math.max(0, fretBaggageWeight - 5))}
                        className={`w-12 h-12 font-bold text-2xl transition-all ${
                          isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                        }`}
                        style={{ borderRadius: '12px 5px 12px 5px' }}
                      >
                        <Minus className="w-5 h-5 mx-auto" />
                      </button>
                      <input
                        type="number"
                        value={fretBaggageWeight}
                        onChange={(e) => {
                          const value = Math.min(FRET_TARIFS.bagages_max, Math.max(0, parseInt(e.target.value) || 0));
                          setFretBaggageWeight(value);
                        }}
                        className={`flex-1 text-center text-4xl font-black p-4 border-2 ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:border-orange-500`}
                        style={{ borderRadius: '15px' }}
                        max={FRET_TARIFS.bagages_max}
                      />
                      <button
                        onClick={() => setFretBaggageWeight(Math.min(FRET_TARIFS.bagages_max, fretBaggageWeight + 5))}
                        className={`w-12 h-12 font-bold text-2xl text-white transition-all ${
                          isDark ? 'bg-orange-600 hover:bg-orange-500' : 'bg-orange-500 hover:bg-orange-600'
                        }`}
                        style={{ borderRadius: '5px 12px 5px 12px' }}
                      >
                        <Plus className="w-5 h-5 mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 ${isDark ? 'bg-gray-800/50' : 'bg-white'}`} style={{ borderRadius: '15px' }}>
                    <div className="flex items-start gap-2 mb-3">
                      <Luggage className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="font-bold mb-1">Calcul des frais :</div>
                        <div>• Franchise gratuite : {FRET_TARIFS.bagages_franchise} kg</div>
                        <div>• {fretShipType === 'aline_sitoe' ? 'Aline Sitoé Diatta' : 'Aguene/Diambogne'} : {fretShipType === 'aline_sitoe' ? FRET_TARIFS.bagages_aline_sitoe_rate : FRET_TARIFS.bagages_autres_rate} FCFA/kg</div>
                        <div>• Maximum autorisé : {FRET_TARIFS.bagages_max} kg</div>
                      </div>
                    </div>

                    {fretBaggageWeight > FRET_TARIFS.bagages_franchise && (
                      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Poids excédentaire : {fretBaggageWeight - FRET_TARIFS.bagages_franchise} kg
                        </div>
                        <div className={`text-2xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                          {((fretBaggageWeight - FRET_TARIFS.bagages_franchise) * (fretShipType === 'aline_sitoe' ? FRET_TARIFS.bagages_aline_sitoe_rate : FRET_TARIFS.bagages_autres_rate)).toLocaleString()} FCFA
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {(fretVehicleType || fretBaggageWeight > 0) && (
                  <div className={`p-6 mb-6 ${isDark ? 'bg-gradient-to-br from-orange-900/30 to-amber-900/30' : 'bg-gradient-to-br from-orange-100 to-amber-100'}`} style={{ borderRadius: '30px 10px 30px 10px' }}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>TOTAL FRET</div>
                    <div className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {calculateFretTotal().toLocaleString()} <span className="text-2xl">FCFA</span>
                    </div>
                    <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {fretVehicleType && `${fretVehicleType === 'voiture' ? 'Voiture' : 'Moto'}`}
                      {fretVehicleType && fretBaggageWeight > 0 && ' • '}
                      {fretBaggageWeight > 0 && `Bagages: ${fretBaggageWeight} kg`}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className={`w-full py-5 font-black text-xl text-white transition-all flex items-center justify-center gap-3 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                        : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  style={{ borderRadius: '25px 10px 25px 10px' }}
                >
                  Continuer
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {bookingType === 'fret' && step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <CreditCard className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Informations de contact
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pour la confirmation de votre transport FRET
                  </p>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-amber-900/30 border-2 border-amber-700' : 'bg-amber-50 border-2 border-amber-300'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <div className={`font-bold text-lg mb-2 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                        Horaires d'enregistrement FRET
                      </div>
                      <div className={`text-sm space-y-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        <p>• Dakar : 14h30 - 17h30</p>
                        <p>• Ziguinchor : 11h30 - 13h00</p>
                        <p className="font-bold mt-2">Présentez-vous avec vos documents et marchandises</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Téléphone (pour la confirmation)
                  </label>
                  <input
                    type="tel"
                    value={holderPhone}
                    onChange={(e) => setHolderPhone(e.target.value)}
                    placeholder=""
                    className={`w-full p-5 text-xl font-bold border-2 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-orange-500`}
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                  />
                </div>

                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceed()}
                  className={`w-full py-5 font-black text-xl text-white transition-all flex items-center justify-center gap-3 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                        : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  style={{ borderRadius: '25px 10px 25px 10px' }}
                >
                  Continuer
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="text-center mb-8">
                  <div className={`w-20 h-20 mx-auto mb-4 flex items-center justify-center ${
                    bookingType === 'passenger'
                      ? isDark ? 'bg-cyan-500/20' : 'bg-[#E6F1F5]'
                      : isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`} style={{ borderRadius: '40% 60% 70% 30% / 60% 30% 70% 40%' }}>
                    <Check className={`w-12 h-12 ${
                      bookingType === 'passenger'
                        ? isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'
                        : isDark ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                  </div>
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Récapitulatif & Paiement
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vérifiez avant d'acheter
                  </p>
                </div>

                <div className={`mb-6 p-6 ${isDark ? 'bg-amber-900/30 border-2 border-amber-700' : 'bg-amber-50 border-2 border-amber-300'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <div className={`font-bold text-lg mb-2 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                        Informations {bookingType === 'fret' ? 'enregistrement FRET' : 'embarquement'}
                      </div>
                      <div className={`text-sm space-y-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        {bookingType === 'passenger' ? (
                          <>
                            <p>Embarquement : {DEPARTURES[direction].checkin}</p>
                            <p>Départ : {DEPARTURES[direction].departure}</p>
                            <p>Durée : 14h environ • Escale à Karabane (1h)</p>
                            <p>Documents : CNI/Passeport obligatoire + QR Code</p>
                          </>
                        ) : (
                          <>
                            <p>Enregistrement FRET : {DEPARTURES[direction].fretCheckin}</p>
                            <p>Départ : {DEPARTURES[direction].departure}</p>
                            <p>Présentez-vous avec vos documents et marchandises</p>
                            <p>QR Code de confirmation requis</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className={`p-5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '30px 10px 30px 10px' }}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Traversée</div>
                    <div className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {direction === 'dakar_ziguinchor' ? 'Dakar → Ziguinchor' : 'Ziguinchor → Dakar'}
                    </div>
                    <div className={`text-lg ${
                      bookingType === 'passenger'
                        ? isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'
                        : isDark ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      {DEPARTURES[direction].days}
                    </div>
                  </div>

                  {bookingType === 'passenger' && (
                    <div className={`p-5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '10px 30px 10px 30px' }}>
                      <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Hébergement</div>
                      <div className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getCabinLabel(accommodationType)}
                      </div>
                      <div className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {passengersCount} passager{passengersCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  {bookingType === 'fret' && (
                    <div className={`p-5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '10px 30px 10px 30px' }}>
                      <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Transport FRET</div>
                      <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {fretVehicleType && (
                          <div className="flex items-center gap-2">
                            <Car className="w-5 h-5" />
                            <span className="font-bold">{fretVehicleType === 'voiture' ? 'Voiture' : 'Moto'}</span>
                            <span>• {(fretVehicleType === 'voiture' ? FRET_TARIFS.voiture : FRET_TARIFS.moto).toLocaleString()} FCFA</span>
                          </div>
                        )}
                        {fretBaggageWeight > 0 && (
                          <div className="flex items-center gap-2">
                            <Luggage className="w-5 h-5" />
                            <span className="font-bold">Bagages: {fretBaggageWeight} kg</span>
                            {fretBaggageWeight > FRET_TARIFS.bagages_franchise && (
                              <span>• {((fretBaggageWeight - FRET_TARIFS.bagages_franchise) * (fretShipType === 'aline_sitoe' ? FRET_TARIFS.bagages_aline_sitoe_rate : FRET_TARIFS.bagages_autres_rate)).toLocaleString()} FCFA</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={`p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '25px 12px 25px 12px' }}>
                    <div className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Mode de paiement</div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setPaymentMethod('wave')}
                        className={`p-6 transition-all transform hover:scale-105 ${
                          paymentMethod === 'wave'
                            ? isDark
                              ? 'bg-[#1E3A8A] border-4 border-blue-400 shadow-2xl'
                              : 'bg-blue-50 border-4 border-blue-500 shadow-2xl'
                            : isDark
                              ? 'bg-gray-800 border-2 border-gray-700 opacity-60'
                              : 'bg-white border-2 border-gray-300 opacity-60'
                        }`}
                        style={{ borderRadius: '40px 120px 40px 120px' }}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-28 h-28 bg-white rounded-xl flex items-center justify-center p-4 shadow-lg">
                            <img src="/Wave.svg" alt="Wave" className="w-full h-full object-contain" />
                          </div>
                          <div className={`text-xl font-black ${paymentMethod === 'wave' ? isDark ? 'text-blue-400' : 'text-blue-700' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Wave
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('orange')}
                        className={`p-6 transition-all transform hover:scale-105 ${
                          paymentMethod === 'orange'
                            ? isDark
                              ? 'bg-[#D97706] border-4 border-orange-400 shadow-2xl'
                              : 'bg-orange-50 border-4 border-orange-500 shadow-2xl'
                            : isDark
                              ? 'bg-gray-800 border-2 border-gray-700 opacity-60'
                              : 'bg-white border-2 border-gray-300 opacity-60'
                        }`}
                        style={{ borderRadius: '40px 120px 40px 120px' }}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-28 h-28 bg-white rounded-xl flex items-center justify-center p-4 shadow-lg">
                            <img src="/Orange-Money.svg" alt="Orange Money" className="w-full h-full object-contain" />
                          </div>
                          <div className={`text-xl font-black ${paymentMethod === 'orange' ? isDark ? 'text-orange-400' : 'text-orange-700' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Orange Money
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className={`p-8 ${
                    bookingType === 'passenger'
                      ? isDark ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'
                      : isDark ? 'bg-gradient-to-br from-orange-900/30 to-amber-900/30' : 'bg-gradient-to-br from-orange-100 to-amber-100'
                  }`} style={{ borderRadius: '40px 15px 40px 15px' }}>
                    <div className={`text-sm font-bold mb-2 ${
                      bookingType === 'passenger'
                        ? isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'
                        : isDark ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      TOTAL À PAYER
                    </div>
                    <div className={`text-6xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {(bookingType === 'passenger' ? calculateTotal() : calculateFretTotal()).toLocaleString()}
                    </div>
                    <div className={`text-2xl font-bold ${
                      bookingType === 'passenger'
                        ? isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'
                        : isDark ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      FCFA
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className={`w-full py-6 font-black text-2xl text-white transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : bookingType === 'passenger'
                        ? isDark
                          ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C] shadow-2xl'
                          : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E] shadow-2xl'
                        : isDark
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-2xl'
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-2xl'
                  }`}
                  style={{ borderRadius: '30px 12px 30px 12px' }}
                >
                  {loading ? 'Traitement...' : 'Confirmer & Payer'}
                  {!loading && <ArrowRight className="w-7 h-7" />}
                </button>

                <p className={`text-center text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Paiement sécurisé • Confirmation immédiate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default COSAMABookingPage;
