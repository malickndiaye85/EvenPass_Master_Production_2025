import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Ship, Phone, Check, Plus, Minus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { db } from '../../firebase';
import { ref, push, set } from 'firebase/database';

// Tarifs officiels LMDG (A/R inclus)
const OFFICIAL_TARIFS = {
  national: { adulte: 1500, enfant: 500 },
  resident: { adulte: 2700, enfant: 1700 },
  non_resident: { adulte: 5200, enfant: 2700 },
  goreen: { adulte: 100, enfant: 50 }
};

// Horaires officiels
const SCHEDULES_WEEKDAY = {
  dakar: ['06h15', '07h30', '10h00', '11h00', '12h30', '14h00', '15h30', '17h00', '18h30'],
  goree: ['06h45', '08h00', '10h30', '12h00', '14h00', '15h00', '16h30', '18h00', '19h00']
};

const SCHEDULES_WEEKEND = {
  dakar: ['07h00', '09h00', '10h00', '12h00', '14h00', '16h00', '18h00'],
  goree: ['07h30', '09h30', '10h30', '12h30', '14h30', '16h30', '18h30']
};

const LMDGBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'dakar' | 'goree'>('dakar');
  const [selectedTime, setSelectedTime] = useState('');
  const [category, setCategory] = useState<'national' | 'resident' | 'non_resident' | 'goreen'>('national');
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange'>('wave');
  const [loading, setLoading] = useState(false);

  // Détection jour de la semaine pour grille horaires
  const isWeekend = (): boolean => {
    const day = new Date().getDay();
    return day === 0; // Dimanche
  };

  const getSchedules = () => {
    return isWeekend() ? SCHEDULES_WEEKEND : SCHEDULES_WEEKDAY;
  };

  const getNextAvailableTime = (): string => {
    const availableTimes = getAvailableTimes();
    return availableTimes.length > 0 ? availableTimes[0] : getSchedules()[direction][0];
  };

  const getAvailableTimes = (): string[] => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const schedules = getSchedules();
    const times = schedules[direction];

    const futureTimes = times.filter(time => {
      const [hour, minute] = time.replace('h', ':').split(':').map(Number);
      return hour > currentHour || (hour === currentHour && minute > currentMinute);
    });

    // Retourner les 3 prochains créneaux disponibles
    return futureTimes.length > 0 ? futureTimes.slice(0, 3) : times.slice(0, 3);
  };

  useEffect(() => {
    const nextTime = getNextAvailableTime();
    setSelectedTime(nextTime);
  }, [direction]);

  const getTarif = (cat: 'national' | 'resident' | 'non_resident' | 'goreen', type: 'adulte' | 'enfant'): number => {
    return OFFICIAL_TARIFS[cat][type];
  };

  const calculateTotal = (): number => {
    const adultPrice = getTarif(category, 'adulte');
    const childPrice = getTarif(category, 'enfant');
    return (adultsCount * adultPrice) + (childrenCount * childPrice);
  };

  const getCategoryLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      national: 'Nationaux',
      resident: 'Résidents Afrique',
      non_resident: 'Non-résidents',
      goreen: 'Goréens'
    };
    return labels[cat] || cat;
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!direction && !!selectedTime;
      case 2: return !!category && (adultsCount > 0 || childrenCount > 0);
      case 3: return phoneNumber.length >= 9;
      default: return false;
    }
  };

  const handleBooking = async () => {
    setLoading(true);

    const bookingRef = push(ref(db, 'pass/lmdg/bookings'));
    const bookingData = {
      reference: `LMDG-${Date.now()}`,
      direction: direction === 'dakar' ? 'Dakar → Gorée' : 'Gorée → Dakar',
      trip_type: 'round_trip',
      departure_time: selectedTime,
      category,
      adults_count: adultsCount,
      children_count: childrenCount,
      phone_number: phoneNumber,
      payment_method: paymentMethod,
      total_amount: calculateTotal(),
      payment_status: 'pending',
      created_at: Date.now()
    };

    try {
      await set(bookingRef, bookingData);

      // Simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 2000));

      setLoading(false);
      alert(`✓ Achat validé !\n\nRéférence : ${bookingData.reference}\nMontant : ${calculateTotal().toLocaleString()} FCFA\nPaiement via ${paymentMethod === 'wave' ? 'Wave' : 'Orange Money'}\n\nVotre QR Code a été envoyé au ${phoneNumber}`);

      navigate('/pass/services');
    } catch (error) {
      setLoading(false);
      alert('Erreur lors de l\'achat');
    }
  };

  const steps = [
    { number: 1, label: 'Horaire' },
    { number: 2, label: 'Tarifs' },
    { number: 3, label: 'Contact' },
    { number: 4, label: 'Paiement' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => step === 1 ? navigate('/pass/services') : setStep(step - 1)} className="flex items-center gap-2 group">
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'} group-hover:translate-x-[-4px] transition-transform`} />
              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {step === 1 ? 'Services' : 'Retour'}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <Logo size="sm" variant="default" />
              <div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>LMDG</div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trajet 20 min • Sans réservation</div>
              </div>
            </div>
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
            {step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Choisissez votre horaire
                  </h2>
                  <p className={`text-lg mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Billet Aller-Retour Inclus
                  </p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                    {isWeekend() ? 'Horaires Dimanche/Fériés' : 'Horaires Semaine'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className={`p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '40px 10px 40px 10px' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setDirection('dakar')}
                        className={`flex-1 py-3 px-4 font-bold transition-all ${
                          direction === 'dakar'
                            ? isDark
                              ? 'bg-cyan-500 text-white'
                              : 'bg-[#0A7EA3] text-white'
                            : isDark
                              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{ borderRadius: '20px 5px 20px 5px' }}
                      >
                        Au départ de Dakar
                      </button>
                      <button
                        onClick={() => setDirection('goree')}
                        className={`flex-1 py-3 px-4 font-bold transition-all ${
                          direction === 'goree'
                            ? isDark
                              ? 'bg-cyan-500 text-white'
                              : 'bg-[#0A7EA3] text-white'
                            : isDark
                              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{ borderRadius: '5px 20px 5px 20px' }}
                      >
                        Au départ de Gorée
                      </button>
                    </div>

                    <div className="space-y-3">
                      {getAvailableTimes().map((time, index) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`w-full py-6 px-6 font-black text-2xl transition-all transform hover:scale-105 ${
                            selectedTime === time
                              ? isDark
                                ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] text-white shadow-2xl'
                                : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] text-white shadow-2xl'
                              : isDark
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                                : 'bg-white text-gray-900 hover:bg-gray-100 border-2 border-gray-300'
                          }`}
                          style={{ borderRadius: '25px 10px 25px 10px' }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-3xl font-black ${selectedTime === time ? 'text-white' : isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                                {time}
                              </div>
                              <div className={`text-sm font-semibold mt-1 ${selectedTime === time ? 'text-white/80' : isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                {index === 0 ? 'Prochain départ' : `Dans ${index + 1}${index === 0 ? 'er' : 'ème'}`}
                              </div>
                            </div>
                            {selectedTime === time && (
                              <Check className="w-8 h-8 text-white" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`p-6 ${isDark ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'}`} style={{ borderRadius: '10px 40px 10px 40px' }}>
                    <div className={`text-center mb-6`}>
                      <div className={`text-5xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>⇄</div>
                      <div className={`text-xl font-bold mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                        Billet Aller-Retour
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Montez dans n'importe quelle chaloupe à tout moment
                      </div>
                    </div>

                    <div className={`p-4 mb-4 ${isDark ? 'bg-gray-900/40' : 'bg-white/60'}`} style={{ borderRadius: '20px 8px 20px 8px' }}>
                      <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                        Sélection actuelle
                      </div>
                      <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {direction === 'dakar' ? 'Dakar → Gorée' : 'Gorée → Dakar'}
                      </div>
                      <div className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                        Départ à {selectedTime}
                      </div>
                    </div>

                    <div className={`p-4 ${isDark ? 'bg-gray-900/40' : 'bg-white/60'}`} style={{ borderRadius: '8px 20px 8px 20px' }}>
                      <div className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Informations
                      </div>
                      <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <li>✓ Durée du trajet : 20 minutes</li>
                        <li>✓ Retour libre à n'importe quelle heure</li>
                        <li>✓ Valable toute la journée</li>
                      </ul>
                    </div>
                  </div>
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

            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tarifs Aller/Retour
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sélectionnez votre catégorie
                  </p>
                </div>

                <div className="mb-6 flex justify-center gap-3">
                  {(['national', 'resident', 'non_resident', 'goreen'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-6 py-3 font-bold transition-all ${
                        category === cat
                          ? isDark
                            ? 'bg-cyan-500 text-white'
                            : 'bg-[#0A7EA3] text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{ borderRadius: '20px 8px 20px 8px' }}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className={`p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '40px 15px 40px 15px' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Adultes</div>
                        <div className={`text-xl font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                          {getTarif(category, 'adulte').toLocaleString()} FCFA
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          par personne (A/R inclus)
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAdultsCount(Math.max(0, adultsCount - 1))}
                          className={`w-14 h-14 font-bold text-2xl transition-all ${
                            isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                          }`}
                          style={{ borderRadius: '15px 5px 15px 5px' }}
                        >
                          <Minus className="w-6 h-6 mx-auto" />
                        </button>
                        <span className={`text-4xl font-black w-16 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {adultsCount}
                        </span>
                        <button
                          onClick={() => setAdultsCount(adultsCount + 1)}
                          className={`w-14 h-14 font-bold text-2xl text-white transition-all ${
                            isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#0A7EA3] hover:bg-[#006B8C]'
                          }`}
                          style={{ borderRadius: '5px 15px 5px 15px' }}
                        >
                          <Plus className="w-6 h-6 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '15px 40px 15px 40px' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Enfants</div>
                        <div className={`text-xl font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                          {getTarif(category, 'enfant').toLocaleString()} FCFA
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          par enfant (A/R inclus)
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                          className={`w-14 h-14 font-bold text-2xl transition-all ${
                            isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                          }`}
                          style={{ borderRadius: '15px 5px 15px 5px' }}
                        >
                          <Minus className="w-6 h-6 mx-auto" />
                        </button>
                        <span className={`text-4xl font-black w-16 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {childrenCount}
                        </span>
                        <button
                          onClick={() => setChildrenCount(childrenCount + 1)}
                          className={`w-14 h-14 font-bold text-2xl text-white transition-all ${
                            isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#0A7EA3] hover:bg-[#006B8C]'
                          }`}
                          style={{ borderRadius: '5px 15px 5px 15px' }}
                        >
                          <Plus className="w-6 h-6 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'}`} style={{ borderRadius: '30px 10px 30px 10px' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>TOTAL À PAYER</div>
                      <div className={`text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {calculateTotal().toLocaleString()} <span className="text-2xl">FCFA</span>
                      </div>
                      <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {adultsCount} adulte{adultsCount > 1 ? 's' : ''}{childrenCount > 0 && ` + ${childrenCount} enfant${childrenCount > 1 ? 's' : ''}`}
                      </div>
                    </div>
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

            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <Phone className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Informations de contact
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pour recevoir votre QR Code par SMS
                  </p>
                </div>

                <div className={`p-6 mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '30px 15px 30px 15px' }}>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+221 XX XXX XX XX"
                    className={`w-full p-5 text-xl font-bold border-2 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:border-cyan-500`}
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                  />
                  <p className={`text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Votre billet avec QR Code sera envoyé instantanément
                  </p>
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

            {step === 4 && (
              <div>
                <div className="text-center mb-8">
                  <div className={`w-20 h-20 mx-auto mb-4 flex items-center justify-center ${
                    isDark ? 'bg-cyan-500/20' : 'bg-[#E6F1F5]'
                  }`} style={{ borderRadius: '40% 60% 70% 30% / 60% 30% 70% 40%' }}>
                    <Check className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  </div>
                  <h2 className={`text-4xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Récapitulatif
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vérifiez avant d'acheter
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className={`p-5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '30px 10px 30px 10px' }}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trajet</div>
                    <div className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Aller-Retour Inclus ⇄
                    </div>
                    <div className={`text-lg ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      {direction === 'dakar' ? 'Dakar → Gorée' : 'Gorée → Dakar'}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Départ à {selectedTime}
                    </div>
                  </div>

                  <div className={`p-5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '10px 30px 10px 30px' }}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Passagers</div>
                    <div className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getCategoryLabel(category)}
                    </div>
                    <div className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {adultsCount} adulte{adultsCount > 1 ? 's' : ''}{childrenCount > 0 && ` + ${childrenCount} enfant${childrenCount > 1 ? 's' : ''}`}
                    </div>
                  </div>

                  <div className={`p-5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`} style={{ borderRadius: '30px 10px 30px 10px' }}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Contact</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {phoneNumber}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      QR Code envoyé par SMS
                    </div>
                  </div>

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
                        style={{ borderRadius: '20px 8px 20px 8px' }}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <span className="text-3xl font-black text-[#1E3A8A]">W</span>
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
                        style={{ borderRadius: '8px 20px 8px 20px' }}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <span className="text-3xl font-black text-[#FF7A00]">OM</span>
                          </div>
                          <div className={`text-xl font-black ${paymentMethod === 'orange' ? isDark ? 'text-orange-400' : 'text-orange-700' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Orange Money
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className={`p-8 ${isDark ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'}`} style={{ borderRadius: '40px 15px 40px 15px' }}>
                    <div className={`text-sm font-bold mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      TOTAL À PAYER
                    </div>
                    <div className={`text-6xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {calculateTotal().toLocaleString()}
                    </div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
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
                      : isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C] shadow-2xl'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E] shadow-2xl'
                  }`}
                  style={{ borderRadius: '30px 12px 30px 12px' }}
                >
                  {loading ? 'Traitement...' : 'Acheter'}
                  {!loading && <ArrowRight className="w-7 h-7" />}
                </button>

                <p className={`text-center text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Paiement sécurisé • Billet immédiat
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LMDGBookingPage;
