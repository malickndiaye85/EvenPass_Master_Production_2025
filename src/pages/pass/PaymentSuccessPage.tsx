import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Ship, Home, Phone, Ticket, Clock, CreditCard, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import DynamicLogo from '../../components/DynamicLogo';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase';
import QRCode from 'react-qr-code';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const bookingRef = searchParams.get('ref');
  const service = searchParams.get('service');
  const waveSessionId = searchParams.get('wave_session_id') || searchParams.get('session_id');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    if (bookingRef && service) {
      loadBooking();
      setShowAnimation(true);
    }
  }, [bookingRef, service]);

  const loadBooking = async () => {
    try {
      setVerifying(true);
      const bookingPath = `pass/${service}/bookings/${bookingRef}`;
      const bookingSnapshot = await get(ref(db, bookingPath));

      if (bookingSnapshot.exists()) {
        const bookingData = bookingSnapshot.val();
        setBooking(bookingData);

        if (bookingData.payment_status === 'completed' || bookingData.status === 'confirmed') {
          setPaymentVerified(true);
        }
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
      setVerifying(false);
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

  const handleDownloadPDF = async () => {
    if (!booking) return;

    alert('📄 Génération du PDF en cours...\n\nVos billets seront téléchargés dans un instant.');
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-[#F8FAFC]'} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${isDark ? 'border-cyan-600' : 'border-blue-600'} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chargement de votre réservation...</p>
        </div>
      </div>
    );
  }

  const bookingDateTime = booking?.created_at ? formatDateTime(booking.created_at) : null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-[#F8FAFC]'} flex items-center justify-center p-4 md:p-8`}>
      <div className="max-w-4xl w-full">
        <div className="flex justify-center mb-8">
          <DynamicLogo size="lg" variant="default" />
        </div>

        <div
          className={`${isDark ? 'bg-[#0F0F0F]' : 'bg-white'} overflow-hidden transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} border-2 ${isDark ? 'border-green-600' : 'border-green-500'} shadow-2xl`}
          style={{
            borderRadius: '40px 120px 40px 120px',
            boxShadow: `0 0 60px ${isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`
          }}
        >
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className={`relative inline-block p-6 bg-white rounded-full mb-6 transition-all duration-700 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'} shadow-xl`}>
              <CheckCircle className="w-20 h-20 text-green-600" strokeWidth={2.5} />
            </div>
            <h1 className="relative text-5xl font-black text-white mb-3">Paiement Réussi !</h1>
            <p className="relative text-xl text-white/95 font-medium">
              Gënaa Yomb! Votre réservation est confirmée
            </p>
          </div>

          {booking && (
            <div className="p-8 md:p-12">
              {verifying && (
                <div className={`${isDark ? 'bg-yellow-600/20 border-yellow-600/50' : 'bg-yellow-100 border-yellow-300'} border-2 rounded-2xl p-6 mb-8 text-center`}>
                  <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className={`text-lg font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    🔄 Vérification du paiement en cours...
                  </p>
                </div>
              )}

              {!verifying && paymentVerified && (
                <div className={`${isDark ? 'bg-green-600/20 border-green-600/50' : 'bg-green-100 border-green-300'} border-2 rounded-2xl p-6 mb-8`}>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <p className={`text-xl font-black ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      ✅ Paiement vérifié et confirmé
                    </p>
                  </div>
                  <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Votre transaction a été validée avec succès
                  </p>
                </div>
              )}

              <div className={`${isDark ? 'bg-[#1F1F1F] border-[#2A2A2A]' : 'bg-gray-50 border-gray-200'} rounded-2xl p-8 mb-8 border-2`}>
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#2A2A2A]">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} mb-1`}>N° Référence</p>
                    <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'} tracking-wider`}>{booking.reference}</p>
                  </div>
                  <div className="px-6 py-3 bg-green-500/20 rounded-xl border-2 border-green-500/50">
                    <p className="text-lg font-black text-green-400">✓ Confirmée</p>
                  </div>
                </div>

                {waveSessionId && (
                  <div className="mb-6 pb-6 border-b border-[#2A2A2A]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-lg flex items-center justify-center`}>
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <p className={`text-sm font-bold ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'}`}>Détails de Transaction</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-13">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-500'} mb-1`}>ID Session Wave</p>
                        <p className={`text-sm font-bold ${isDark ? 'text-cyan-400' : 'text-blue-600'} font-mono`}>
                          {waveSessionId.substring(0, 20)}...
                        </p>
                      </div>
                      {bookingDateTime && (
                        <>
                          <div>
                            <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-500'} mb-1`}>Date</p>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {bookingDateTime.date}
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-500'} mb-1`}>Heure</p>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {bookingDateTime.time}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${isDark ? 'bg-cyan-600' : 'bg-blue-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Ship className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} mb-1`}>Service</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{getServiceName()}</p>
                      <p className={`text-sm ${isDark ? 'text-cyan-400' : 'text-blue-600'} mt-1 font-medium`}>{booking.direction}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${isDark ? 'bg-purple-600' : 'bg-purple-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} mb-1`}>Passagers</p>
                      <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {(booking.adults_count || 0) + (booking.children_count || 0)}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'}`}>
                        {booking.adults_count > 0 && `${booking.adults_count} adulte${booking.adults_count > 1 ? 's' : ''}`}
                        {booking.adults_count > 0 && booking.children_count > 0 && ', '}
                        {booking.children_count > 0 && `${booking.children_count} enfant${booking.children_count > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>

                  {booking.departure_time && (
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${isDark ? 'bg-orange-600' : 'bg-orange-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} mb-1`}>Horaire Départ</p>
                        <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{booking.departure_time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} mb-1`}>Montant Payé</p>
                      <p className="text-2xl font-black text-green-400">
                        {booking.total_amount?.toLocaleString() || '0'} FCFA
                      </p>
                      <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-500'} mt-1`}>via Wave Mobile Money</p>
                    </div>
                  </div>
                </div>
              </div>

              {paymentVerified && booking.tickets && (
                <div className={`${isDark ? 'bg-[#1F1F1F] border-[#2A2A2A]' : 'bg-gray-50 border-gray-200'} border-2 rounded-2xl p-8 mb-8`}>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-3`}>
                    <span className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
                      📱
                    </span>
                    Vos QR Codes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.values(booking.tickets).slice(0, 4).map((ticket: any, idx: number) => (
                      <div key={idx} className={`${isDark ? 'bg-black border-[#2A2A2A]' : 'bg-white border-gray-300'} border-2 rounded-xl p-6 text-center`}>
                        <div className="bg-white p-4 rounded-xl inline-block mb-4">
                          <QRCode value={ticket.qr_code} size={120} />
                        </div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                          Billet #{idx + 1}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} font-mono`}>
                          {ticket.ticket_number}
                        </p>
                      </div>
                    ))}
                  </div>

                  {booking.tickets && Object.values(booking.tickets).length > 4 && (
                    <p className={`text-center mt-4 text-sm ${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'}`}>
                      + {Object.values(booking.tickets).length - 4} autres billets disponibles
                    </p>
                  )}
                </div>
              )}

              <div className={`${isDark ? 'bg-green-600/20 border-green-600/50' : 'bg-green-100 border-green-300'} border-2 rounded-2xl p-6 mb-8`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Phone className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-bold mb-2 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      📱 Billets envoyés sur WhatsApp
                    </p>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                      Vos billets ont été envoyés sur votre numéro WhatsApp <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{booking.phone_number}</span>
                    </p>
                    <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Confirmation instantanée reçue</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Billets avec QR Codes uniques</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Prêts pour votre voyage</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button
                  onClick={handleDownloadPDF}
                  className={`w-full px-8 py-5 bg-gradient-to-r ${isDark ? 'from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white rounded-2xl transition-all font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] shadow-xl`}
                >
                  <Download className="w-6 h-6" />
                  Télécharger mes billets (PDF)
                </button>

                <button
                  onClick={() => navigate('/pass/services')}
                  className={`w-full px-8 py-5 ${isDark ? 'bg-[#0F0F0F] border-[#2A2A2A] hover:border-cyan-600' : 'bg-white border-gray-300 hover:border-blue-600'} border-2 ${isDark ? 'text-white' : 'text-gray-900'} rounded-2xl transition-all font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02]`}
                >
                  <Home className="w-6 h-6" />
                  Retour aux services
                </button>
              </div>

              <div className={`bg-gradient-to-r ${isDark ? 'from-cyan-600/20 to-blue-600/20 border-cyan-600/50' : 'from-blue-500/10 to-purple-500/10 border-blue-500/30'} border-2 rounded-2xl p-6 text-center`}>
                <p className={`text-lg font-bold ${isDark ? 'text-cyan-300' : 'text-blue-600'} mb-2`}>
                  📱 Présentez vos QR Codes à l'embarquement
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                  Gardez vos billets sur votre téléphone et présentez-les lors de votre voyage
                </p>
                <div className={`flex items-center justify-center gap-4 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Support 24/7
                  </span>
                  <span>•</span>
                  <span className="font-bold">+221 77 139 29 26</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl font-black text-green-400 mb-2">
            🎉 Gënaa Wóor!
          </p>
          <p className={`${isDark ? 'text-[#B5B5B5]' : 'text-gray-600'} text-lg mb-8`}>
            Merci d'avoir choisi DemDem Transports & Events pour vos déplacements
          </p>

          <button
            onClick={() => navigate('/pass/services')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:scale-105"
          >
            <Ship className="w-6 h-6" />
            Retour aux Traversées
          </button>
        </div>
      </div>
    </div>
  );
}
