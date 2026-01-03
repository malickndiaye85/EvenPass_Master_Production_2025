import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Ship, Calendar, Users, Phone, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { db } from '../../firebase';
import { ref, onValue, push, set } from 'firebase/database';

interface Tarifs {
  national: { adulte: number; enfant: number };
  resident: { adulte: number; enfant: number };
  non_resident: { adulte: number; enfant: number };
  goreen: { adulte: number; enfant: number };
}

interface Schedules {
  dakar_to_goree: string[];
  goree_to_dakar: string[];
}

const LMDGBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>('one_way');
  const [direction, setDirection] = useState<'dakar_to_goree' | 'goree_to_dakar'>('dakar_to_goree');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [category, setCategory] = useState<'national' | 'resident' | 'non_resident' | 'goreen'>('national');
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [tarifs, setTarifs] = useState<Tarifs | null>(null);
  const [schedules, setSchedules] = useState<Schedules | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tarifsRef = ref(db, 'pass/lmdg/tarifs');
    const schedulesRef = ref(db, 'pass/lmdg/schedules');

    onValue(tarifsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTarifs(snapshot.val());
      }
    });

    onValue(schedulesRef, (snapshot) => {
      if (snapshot.exists()) {
        setSchedules(snapshot.val());
      }
    });
  }, []);

  const getTarif = (cat: keyof Tarifs, type: 'adulte' | 'enfant'): number => {
    if (!tarifs) return 0;
    return tarifs[cat][type];
  };

  const calculateTotal = (): number => {
    const adultPrice = getTarif(category, 'adulte');
    const childPrice = getTarif(category, 'enfant');
    const subtotal = (adultsCount * adultPrice) + (childrenCount * childPrice);
    return tripType === 'round_trip' ? subtotal * 2 : subtotal;
  };

  const getCategoryLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      national: 'National Sénégalais',
      resident: 'Résident étranger',
      non_resident: 'Non-résident / Touriste',
      goreen: 'Goréen'
    };
    return labels[cat] || cat;
  };

  const getDirectionLabel = (dir: string): string => {
    return dir === 'dakar_to_goree' ? 'Dakar → Gorée' : 'Gorée → Dakar';
  };

  const filteredSchedules = schedules?.[direction] || [];

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return true;
      case 2: return !!direction;
      case 3:
        if (tripType === 'round_trip') {
          return !!departureDate && !!departureTime && !!returnDate && !!returnTime;
        }
        return !!departureDate && !!departureTime;
      case 4: return !!category;
      case 5: return adultsCount > 0;
      case 6: return phoneNumber.length >= 9;
      default: return false;
    }
  };

  const handleBooking = async () => {
    setLoading(true);

    const bookingRef = push(ref(db, 'pass/lmdg/bookings'));
    const bookingData = {
      reference: `LMDG-${Date.now()}`,
      direction: tripType === 'round_trip' ? 'round_trip' : direction,
      travel_date: departureDate,
      departure_time: departureTime,
      return_date: tripType === 'round_trip' ? returnDate : null,
      return_time: tripType === 'round_trip' ? returnTime : null,
      category,
      adults_count: adultsCount,
      children_count: childrenCount,
      phone_number: phoneNumber,
      total_amount: calculateTotal(),
      payment_status: 'pending',
      created_at: Date.now()
    };

    try {
      await set(bookingRef, bookingData);
      setLoading(false);

      navigate('/pass/payment', {
        state: {
          bookingId: bookingRef.key,
          amount: calculateTotal(),
          service: 'LMDG',
          reference: bookingData.reference
        }
      });
    } catch (error) {
      setLoading(false);
      alert('Erreur lors de la réservation');
    }
  };

  const steps = [
    { number: 1, label: 'Trajet' },
    { number: 2, label: 'Direction' },
    { number: 3, label: 'Date' },
    { number: 4, label: 'Catégorie' },
    { number: 5, label: 'Passagers' },
    { number: 6, label: 'Contact' },
    { number: 7, label: 'Paiement' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => step === 1 ? navigate('/pass/services') : setStep(step - 1)} className="flex items-center gap-2 group">
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} group-hover:translate-x-[-4px] transition-transform`} />
              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {step === 1 ? 'Services' : 'Retour'}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <Logo size="sm" variant="default" />
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>LMDG</span>
            </div>
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
                        ? 'bg-cyan-500 text-white'
                        : 'bg-[#0A7EA3] text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-600'
                        : 'bg-gray-200 text-gray-400'
                  }`}>
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
                  <div className={`h-0.5 w-8 md:w-12 ${
                    step > s.number
                      ? isDark ? 'bg-cyan-500' : 'bg-[#0A7EA3]'
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
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Type de trajet
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choisissez votre formule
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setTripType('one_way'); setStep(2); }}
                    className={`p-8 rounded-2xl border-2 transition-all ${
                      tripType === 'one_way'
                        ? isDark
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-[#0A7EA3] bg-[#E6F1F5]'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-4xl mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>→</div>
                    <div className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Aller simple
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Un trajet uniquement
                    </div>
                  </button>

                  <button
                    onClick={() => { setTripType('round_trip'); setStep(2); }}
                    className={`p-8 rounded-2xl border-2 transition-all ${
                      tripType === 'round_trip'
                        ? isDark
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-[#0A7EA3] bg-[#E6F1F5]'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-4xl mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>⇄</div>
                    <div className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Aller-retour
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Prix × 2
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Direction
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sens de départ
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setDirection('dakar_to_goree')}
                    className={`p-8 rounded-2xl border-2 transition-all ${
                      direction === 'dakar_to_goree'
                        ? isDark
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-[#0A7EA3] bg-[#E6F1F5]'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Dakar → Gorée
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Départ depuis le port de Dakar
                    </div>
                  </button>

                  <button
                    onClick={() => setDirection('goree_to_dakar')}
                    className={`p-8 rounded-2xl border-2 transition-all ${
                      direction === 'goree_to_dakar'
                        ? isDark
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-[#0A7EA3] bg-[#E6F1F5]'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Gorée → Dakar
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Départ depuis l'île de Gorée
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
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
                  <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Date et heure
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choisissez votre créneau
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Date de départ
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Heure de départ
                    </label>
                    <select
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:border-cyan-500`}
                    >
                      <option value="">Sélectionnez une heure</option>
                      {filteredSchedules.map((time: string, index: number) => (
                        <option key={index} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {tripType === 'round_trip' && (
                    <>
                      <div className={`pt-6 border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className={`text-lg font-bold mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                          Trajet retour
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Date de retour
                        </label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={departureDate || new Date().toISOString().split('T')[0]}
                          className={`w-full p-4 rounded-xl border-2 ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:border-cyan-500`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Heure de retour
                        </label>
                        <select
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className={`w-full p-4 rounded-xl border-2 ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:border-cyan-500`}
                        >
                          <option value="">Sélectionnez une heure</option>
                          {(schedules?.[direction === 'dakar_to_goree' ? 'goree_to_dakar' : 'dakar_to_goree'] || []).map((time: string, index: number) => (
                            <option key={index} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
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
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Catégorie
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sélectionnez votre statut
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {(['national', 'resident', 'non_resident', 'goreen'] as const).map((cat) => {
                    const adultPrice = getTarif(cat, 'adulte');
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`p-6 rounded-2xl border-2 transition-all text-left ${
                          category === cat
                            ? isDark
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-[#0A7EA3] bg-[#E6F1F5]'
                            : isDark
                              ? 'border-gray-700 hover:border-gray-600'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {getCategoryLabel(cat)}
                        </div>
                        <div className={`text-2xl font-black ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                          {adultPrice.toLocaleString()} FCFA
                        </div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          par adulte
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(5)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
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
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Nombre de passagers
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Adultes et enfants
                  </p>
                </div>

                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Adultes</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {getTarif(category, 'adulte').toLocaleString()} FCFA / personne
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                          className={`w-12 h-12 rounded-xl ${
                            isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-100'
                          } font-bold text-xl`}
                        >
                          −
                        </button>
                        <span className={`text-2xl font-bold w-12 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {adultsCount}
                        </span>
                        <button
                          onClick={() => setAdultsCount(adultsCount + 1)}
                          className={`w-12 h-12 rounded-xl ${
                            isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#0A7EA3] hover:bg-[#006B8C]'
                          } text-white font-bold text-xl`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Enfants</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {getTarif(category, 'enfant').toLocaleString()} FCFA / enfant
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                          className={`w-12 h-12 rounded-xl ${
                            isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-100'
                          } font-bold text-xl`}
                        >
                          −
                        </button>
                        <span className={`text-2xl font-bold w-12 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {childrenCount}
                        </span>
                        <button
                          onClick={() => setChildrenCount(childrenCount + 1)}
                          className={`w-12 h-12 rounded-xl ${
                            isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#0A7EA3] hover:bg-[#006B8C]'
                          } text-white font-bold text-xl`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(6)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 6 && (
              <div>
                <div className="text-center mb-8">
                  <Phone className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Numéro de téléphone
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pour recevoir votre ticket par SMS
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Téléphone mobile
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+221 XX XXX XX XX"
                    className={`w-full p-4 rounded-xl border-2 text-lg ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-cyan-500`}
                  />
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Votre QR Code sera envoyé par SMS instantanément
                  </p>
                </div>

                <button
                  onClick={() => setStep(7)}
                  disabled={!canProceed()}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 7 && (
              <div>
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-cyan-500/20' : 'bg-[#E6F1F5]'
                  }`}>
                    <Check className={`w-10 h-10 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
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
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trajet</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {tripType === 'round_trip' ? 'Aller-retour' : 'Aller simple'}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {getDirectionLabel(direction)}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date et heure</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(departureDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Départ à {departureTime}
                    </div>
                    {tripType === 'round_trip' && returnDate && (
                      <div className={`text-md mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Retour le {new Date(returnDate).toLocaleDateString('fr-FR')} à {returnTime}
                      </div>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Passagers</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getCategoryLabel(category)}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {adultsCount} adulte{adultsCount > 1 ? 's' : ''}
                      {childrenCount > 0 && ` + ${childrenCount} enfant${childrenCount > 1 ? 's' : ''}`}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Contact</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {phoneNumber}
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${
                    isDark ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'
                  }`}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>TOTAL À PAYER</div>
                    <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {calculateTotal().toLocaleString()} FCFA
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
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                  }`}
                >
                  {loading ? 'Traitement...' : 'Procéder au paiement'}
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

export default LMDGBookingPage;
