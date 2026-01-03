import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Ship, Users, CreditCard, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { db } from '../../firebase';
import { ref, onValue, push, set, runTransaction } from 'firebase/database';
import { AlertCircle } from 'lucide-react';
import { calculateCommissions } from '../../lib/passCommissions';

interface CabinType {
  id: string;
  name: string;
  capacity: number;
  base_price: number;
  description: string;
  amenities: string[];
}

interface Schedule {
  id: string;
  direction: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
}

const COSAMABookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [scheduleId, setScheduleId] = useState('');
  const [accommodationType, setAccommodationType] = useState<'cabin_2' | 'cabin_4' | 'cabin_8' | 'pullman'>('cabin_4');
  const [holderName, setHolderName] = useState('');
  const [holderCNI, setHolderCNI] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [holderEmail, setHolderEmail] = useState('');

  const [cabinTypes, setCabinTypes] = useState<CabinType[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCabinTypes();
    fetchSchedules();
  }, []);

  const fetchCabinTypes = () => {
    const cabinTypesRef = ref(db, 'pass/cosama/cabin_types');
    onValue(cabinTypesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const cabinTypesArray: CabinType[] = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name,
          capacity: data[key].capacity,
          base_price: data[key].price,
          description: data[key].description,
          amenities: data[key].amenities
        }));
        setCabinTypes(cabinTypesArray);
      }
    });
  };

  const fetchSchedules = () => {
    const schedulesRef = ref(db, 'pass/cosama/schedules/dakar_ziguinchor');
    onValue(schedulesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const schedulesArray: Schedule[] = Object.keys(data).map((key) => ({
          id: key,
          direction: 'dakar_to_ziguinchor',
          departure_date: data[key].date,
          departure_time: data[key].departure_time,
          arrival_date: data[key].date,
          arrival_time: data[key].arrival_time
        }));
        setSchedules(schedulesArray);
      }
    });
  };

  const getAccommodationPrice = (): number => {
    if (accommodationType === 'pullman') return 15000;
    const cabin = cabinTypes.find(c => {
      if (accommodationType === 'cabin_2') return c.capacity === 2;
      if (accommodationType === 'cabin_4') return c.capacity === 4;
      if (accommodationType === 'cabin_8') return c.capacity === 8;
      return false;
    });
    return cabin?.base_price || 0;
  };

  const getAccommodationLabel = (): string => {
    const labels: Record<string, string> = {
      cabin_2: 'Cabine 2 places',
      cabin_4: 'Cabine 4 places',
      cabin_8: 'Cabine 8 places',
      pullman: 'Fauteuil Pullman'
    };
    return labels[accommodationType] || '';
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!scheduleId;
      case 2: return !!accommodationType;
      case 3: return !!holderName && holderCNI.length === 13 && holderPhone.length >= 9;
      default: return false;
    }
  };

  const handleBooking = async () => {
    setLoading(true);

    const baseAmount = getAccommodationPrice();
    const { totalAmount } = calculateCommissions(baseAmount);
    const bookingRef = push(ref(db, 'pass/cosama/bookings'));

    const bookingData = {
      booking_reference: `COSAMA-${Date.now()}`,
      schedule_id: scheduleId,
      direction: schedules.find(s => s.id === scheduleId)?.direction || '',
      departure_date: schedules.find(s => s.id === scheduleId)?.departure_date || '',
      accommodation_type: accommodationType,
      holder_name: holderName,
      holder_cni: holderCNI,
      holder_phone: holderPhone,
      holder_email: holderEmail,
      base_amount: baseAmount,
      total_amount: totalAmount,
      payment_status: 'pending',
      created_at: Date.now()
    };

    try {
      await set(bookingRef, bookingData);
      setLoading(false);

      navigate('/pass/payment', {
        state: {
          bookingId: bookingRef.key,
          amount: totalAmount,
          service: 'COSAMA',
          reference: bookingData.booking_reference,
          showTravelAdvice: true
        }
      });
    } catch (error) {
      setLoading(false);
      alert('Erreur lors de la réservation');
    }
  };

  const selectedSchedule = schedules.find(s => s.id === scheduleId);

  const steps = [
    { number: 1, label: 'Traversée' },
    { number: 2, label: 'Hébergement' },
    { number: 3, label: 'Identification' },
    { number: 4, label: 'Paiement' }
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
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>COSAMA</span>
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
                  <div className={`h-0.5 w-12 md:w-16 ${
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
                    Sélection de la traversée
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Dakar ⇄ Ziguinchor
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
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-[#0A7EA3] bg-[#E6F1F5]'
                          : isDark
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {schedule.direction === 'dakar_to_ziguinchor' ? 'Dakar → Ziguinchor' : 'Ziguinchor → Dakar'}
                      </div>
                      <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Départ : {new Date(schedule.departure_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {schedule.departure_time?.substring(0, 5)}
                      </div>
                      <div className={`text-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Arrivée : {new Date(schedule.arrival_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {schedule.arrival_time?.substring(0, 5)}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
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

            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Type d'hébergement
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cabines ou Pullman
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {cabinTypes.map((cabin) => {
                    const cabinKey = cabin.capacity === 2 ? 'cabin_2' : cabin.capacity === 4 ? 'cabin_4' : 'cabin_8';
                    return (
                      <button
                        key={cabin.id}
                        onClick={() => setAccommodationType(cabinKey as any)}
                        className={`p-6 rounded-2xl border-2 transition-all text-left ${
                          accommodationType === cabinKey
                            ? isDark
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-[#0A7EA3] bg-[#E6F1F5]'
                            : isDark
                              ? 'border-gray-700 hover:border-gray-600'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {cabin.name}
                        </div>
                        <div className={`text-2xl font-black mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                          {cabin.base_price.toLocaleString()} FCFA
                        </div>
                        <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {cabin.description}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cabin.amenities?.slice(0, 2).map((amenity, idx) => (
                            <span key={idx} className={`text-xs px-2 py-1 rounded ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setAccommodationType('pullman')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      accommodationType === 'pullman'
                        ? isDark
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-[#0A7EA3] bg-[#E6F1F5]'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Fauteuil Pullman
                    </div>
                    <div className={`text-2xl font-black mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                      15 000 FCFA
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Siège inclinable climatisé
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
                  <CreditCard className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Identification
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    CNI obligatoire
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Prénom et nom"
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Numéro CNI * (13 chiffres obligatoires)
                    </label>
                    <input
                      type="text"
                      value={holderCNI}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        if (cleaned.length <= 13) {
                          setHolderCNI(cleaned);
                        }
                      }}
                      placeholder="1234567890123"
                      maxLength={13}
                      className={`w-full p-4 rounded-xl border-2 font-mono ${
                        holderCNI && holderCNI.length !== 13 ? 'border-red-500' :
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                    {holderCNI && holderCNI.length !== 13 && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Le numéro CNI doit contenir exactement 13 chiffres ({holderCNI.length}/13)</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={holderPhone}
                      onChange={(e) => setHolderPhone(e.target.value)}
                      placeholder="+221 XX XXX XX XX"
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email (optionnel)
                    </label>
                    <input
                      type="email"
                      value={holderEmail}
                      onChange={(e) => setHolderEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className={`w-full p-4 rounded-xl border-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:border-cyan-500`}
                    />
                  </div>
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

                <div className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-amber-900/30 border-2 border-amber-700' : 'bg-amber-50 border-2 border-amber-300'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <div className={`font-bold text-lg mb-2 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                        Conseil Voyageur
                      </div>
                      <div className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        <p className="mb-2">
                          <strong>Embarquement :</strong> Entre 15h00 et 17h00 au port de Dakar
                        </p>
                        <p className="mb-2">
                          <strong>Départ :</strong> Le bateau lève l'ancre à 20h00 précises
                        </p>
                        <p className="mb-2">
                          <strong>Durée de la traversée :</strong> 14-16 heures
                        </p>
                        <p>
                          <strong>Documents :</strong> CNI obligatoire + ticket électronique (QR Code)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Traversée</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedSchedule?.direction === 'dakar_to_ziguinchor' ? 'Dakar → Ziguinchor' : 'Ziguinchor → Dakar'}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Départ le {selectedSchedule && new Date(selectedSchedule.departure_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Hébergement</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getAccommodationLabel()}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Titulaire</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {holderName}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      CNI : {holderCNI}
                    </div>
                    <div className={`text-md ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tél : {holderPhone}
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${
                    isDark ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'
                  }`}>
                    <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>TOTAL À PAYER</div>
                    <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getAccommodationPrice().toLocaleString()} FCFA
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

export default COSAMABookingPage;
