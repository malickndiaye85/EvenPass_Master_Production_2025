import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Ship, Home, Phone, Ticket } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const bookingRef = searchParams.get('ref');
  const service = searchParams.get('service');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (bookingRef && service) {
      loadBooking();
      setShowAnimation(true);
    }
  }, [bookingRef, service]);

  const loadBooking = async () => {
    try {
      const bookingPath = `pass/${service}/bookings/${bookingRef}`;
      const bookingSnapshot = await get(ref(db, bookingPath));

      if (bookingSnapshot.exists()) {
        setBooking(bookingSnapshot.val());
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceName = () => {
    const names: Record<string, string> = {
      lmdg: 'Liaison Maritime Dakar-Gorée',
      cosama: 'COSAMA Transport',
      interregional: 'Transport Interrégional'
    };
    return names[service || ''] || 'Transport';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'} flex items-center justify-center`}>
        <div className={`w-12 h-12 border-4 ${isDark ? 'border-cyan-600' : 'border-blue-600'} border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'} flex items-center justify-center p-4 md:p-8`}>
      <div className="max-w-4xl w-full">
        <div className="flex justify-center mb-8">
          <Logo size="md" variant="default" />
        </div>

        <div
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          style={{
            borderRadius: '40px 120px 40px 120px',
            border: `3px solid ${isDark ? '#10B981' : '#10B981'}`,
            boxShadow: '0 0 60px rgba(16, 185, 129, 0.3)'
          }}
        >
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 p-12 text-center relative overflow-hidden">
            <div className={`relative inline-block p-6 bg-white rounded-full mb-6 transition-all duration-700 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
              <CheckCircle className="w-20 h-20 text-green-600" strokeWidth={2.5} />
            </div>
            <h1 className="relative text-5xl font-black text-white mb-3">Paiement Réussi !</h1>
            <p className="relative text-xl text-white/95 font-medium">
              Gënaa Yomb! Votre réservation est confirmée
            </p>
          </div>

          {booking && (
            <div className="p-8 md:p-12">
              <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-2xl p-8 mb-8 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>N° Référence</p>
                    <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'} tracking-wider`}>{booking.reference}</p>
                  </div>
                  <div className="px-4 py-2 bg-green-500/20 rounded-xl border border-green-500/50">
                    <p className="text-sm font-bold text-green-400">Confirmée</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Ship className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Service</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{getServiceName()}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{booking.direction}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${isDark ? 'bg-purple-600' : 'bg-purple-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Passagers</p>
                      <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {(booking.adults_count || 0) + (booking.children_count || 0)}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {booking.adults_count > 0 && `${booking.adults_count} adulte${booking.adults_count > 1 ? 's' : ''}`}
                        {booking.adults_count > 0 && booking.children_count > 0 && ', '}
                        {booking.children_count > 0 && `${booking.children_count} enfant${booking.children_count > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>

                  {booking.departure_time && (
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${isDark ? 'bg-orange-600' : 'bg-orange-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Horaire</p>
                        <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{booking.departure_time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${isDark ? 'bg-green-600' : 'bg-green-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Montant payé</p>
                      <p className="text-2xl font-black text-green-400">
                        {booking.total_amount.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`bg-green-500/10 border-green-500/30 border rounded-2xl p-6 mb-8`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Phone className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold mb-2 text-green-300">
                      📱 Billets envoyés sur WhatsApp
                    </p>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                      Vos billets ont été envoyés sur votre numéro WhatsApp <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{booking.phone_number}</span>
                    </p>
                    <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Confirmation instantanée reçue</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Billets avec QR Codes uniques</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Prêts pour votre voyage</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button
                  className={`w-full px-8 py-5 ${isDark ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-2xl transition-all font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] shadow-lg`}
                >
                  <Download className="w-6 h-6" />
                  Télécharger mes billets
                </button>

                <button
                  onClick={() => navigate('/pass/services')}
                  className={`w-full px-8 py-5 ${isDark ? 'bg-gray-900 border-gray-700 hover:border-cyan-600' : 'bg-white border-gray-300 hover:border-blue-600'} border-2 ${isDark ? 'text-white' : 'text-gray-900'} rounded-2xl transition-all font-bold text-lg flex items-center justify-center gap-3`}
                >
                  <Home className="w-6 h-6" />
                  Retour aux services
                </button>
              </div>

              <div className={`bg-gradient-to-r ${isDark ? 'from-cyan-500/10 to-blue-500/10 border-cyan-500/30' : 'from-blue-500/10 to-purple-500/10 border-blue-500/30'} border rounded-2xl p-6 text-center`}>
                <p className={`text-lg font-bold ${isDark ? 'text-cyan-300' : 'text-blue-600'} mb-2`}>
                  📱 Présentez vos QR Codes à l'embarquement
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Gardez vos billets sur votre téléphone et présentez-les lors de votre voyage
                </p>
                <div className={`flex items-center justify-center gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Support 24/7
                  </span>
                  <span>•</span>
                  <span>+221 77 139 29 26</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl font-black text-green-400 mb-2">
            🎉 Gënaa Wóor!
          </p>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
            Merci d'avoir choisi EvenPass PASS pour vos déplacements
          </p>
        </div>
      </div>
    </div>
  );
}
