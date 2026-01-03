import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Mail, MessageCircle, Calendar, MapPin, Ticket, Home, Phone } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingNumber = searchParams.get('booking');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (bookingNumber) {
      loadBooking();
      setShowAnimation(true);
    }
  }, [bookingNumber]);

  const loadBooking = async () => {
    try {
      const bookingsRef = collection(firestore, 'bookings');
      const q = query(bookingsRef, where('booking_number', '==', bookingNumber));
      const bookingSnapshot = await getDocs(q);

      if (!bookingSnapshot.empty) {
        const bookingData = { id: bookingSnapshot.docs[0].id, ...bookingSnapshot.docs[0].data() };

        const eventDoc = await getDoc(doc(firestore, 'events', bookingData.event_id));
        const eventData = eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } : null;

        const ticketsRef = collection(firestore, 'tickets');
        const ticketsQuery = query(ticketsRef, where('booking_id', '==', bookingData.id));
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsData = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setBooking({
          ...bookingData,
          event: eventData,
          tickets: ticketsData
        });
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className={`bg-[#1A1A1A] rounded-3xl border-2 border-green-500 overflow-hidden transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className={`relative inline-block p-6 bg-white rounded-full mb-6 transition-all duration-700 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
              <CheckCircle className="w-20 h-20 text-green-600" strokeWidth={2.5} />
            </div>
            <h1 className="relative text-5xl font-black text-white mb-3">Paiement Réussi !</h1>
            <p className="relative text-xl text-white/95 font-medium">
              Gënaa Yomb! Votre commande est confirmée
            </p>
          </div>

          {booking && (
            <div className="p-8 md:p-12">
              <div className="bg-[#0F0F0F] rounded-2xl p-8 mb-8 border border-[#2A2A2A]">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#2A2A2A]">
                  <div>
                    <p className="text-sm text-[#B5B5B5] mb-1">N° Commande</p>
                    <p className="text-3xl font-black text-white tracking-wider">{booking.booking_number}</p>
                  </div>
                  <div className="px-4 py-2 bg-green-500/20 rounded-xl border border-green-500/50">
                    <p className="text-sm font-bold text-green-400">Confirmée</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF5F05] to-[#FF8C42] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#B5B5B5] mb-1">Événement</p>
                      <p className="text-lg font-bold text-white">{booking.event.title}</p>
                      <p className="text-sm text-[#B5B5B5] mt-1">
                        {new Date(booking.event.start_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#B5B5B5] mb-1">Lieu</p>
                      <p className="text-lg font-bold text-white">{booking.event.venue_name}</p>
                      <p className="text-sm text-[#B5B5B5] mt-1">{booking.event.venue_city}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#B5B5B5] mb-1">Billets</p>
                      <p className="text-2xl font-black text-white">{booking.tickets.length}</p>
                      <p className="text-sm text-[#B5B5B5]">billet{booking.tickets.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#B5B5B5] mb-1">Montant payé</p>
                      <p className="text-2xl font-black text-green-400">
                        {booking.total_amount.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${booking.customer_phone ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'} border rounded-2xl p-6 mb-8`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${booking.customer_phone ? 'bg-green-500/20' : 'bg-blue-500/20'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {booking.customer_phone ? (
                      <MessageCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Mail className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-bold mb-2 ${booking.customer_phone ? 'text-green-300' : 'text-blue-300'}`}>
                      {booking.customer_phone ? '📱 Billets envoyés sur WhatsApp' : '✉️ Billets envoyés par Email'}
                    </p>
                    <p className="text-[#B5B5B5] leading-relaxed mb-3">
                      {booking.customer_phone ? (
                        <>Vos billets ont été envoyés sur votre numéro WhatsApp <span className="font-bold text-white">{booking.customer_phone}</span></>
                      ) : (
                        <>Vérifiez votre boîte mail à <span className="font-bold text-white">{booking.customer_email}</span></>
                      )}
                    </p>
                    <ul className="space-y-2 text-sm text-[#B5B5B5]">
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
                        <span>Prêts pour le jour de l'événement</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button
                  className="w-full px-8 py-5 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] hover:from-[#FF7A00] hover:to-[#FFA05D] text-white rounded-2xl transition-all font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] shadow-lg shadow-[#FF5F05]/30"
                >
                  <Download className="w-6 h-6" />
                  Télécharger mes billets
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full px-8 py-5 bg-[#0F0F0F] border-2 border-[#2A2A2A] hover:border-[#FF5F05] text-white rounded-2xl transition-all font-bold text-lg flex items-center justify-center gap-3"
                >
                  <Home className="w-6 h-6" />
                  Retour à l'accueil
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 text-center">
                <p className="text-lg font-bold text-blue-300 mb-2">
                  📱 Présentez vos QR Codes à l'entrée
                </p>
                <p className="text-sm text-[#B5B5B5] mb-4">
                  Gardez vos billets sur votre téléphone et présentez-les le jour de l'événement
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-[#B5B5B5]">
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

        <div className="text-center mt-8">
          <p className="text-2xl font-bold text-[#FF5F05] mb-2">
            🎉 Gënaa Wóor!
          </p>
          <p className="text-[#B5B5B5]">
            Merci d'avoir choisi EvenPass
          </p>
        </div>
      </div>
    </div>
  );
}
