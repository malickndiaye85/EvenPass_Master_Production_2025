import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingNumber = searchParams.get('booking');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingNumber) {
      loadBooking();
    }
  }, [bookingNumber]);

  const loadBooking = async () => {
    try {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          event:events(*),
          tickets(*)
        `)
        .eq('booking_number', bookingNumber)
        .maybeSingle();

      if (data) setBooking(data);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
            <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Paiement réussi!</h1>
            <p className="text-lg text-white/90">Gënaa Yomb! Votre réservation est confirmée</p>
          </div>

          {booking && (
            <div className="p-8">
              <div className="bg-slate-700/50 rounded-xl p-6 mb-6 border border-slate-600">
                <p className="text-sm text-slate-400 mb-2">Numéro de réservation</p>
                <p className="text-2xl font-bold text-white mb-4">{booking.booking_number}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-400">Événement</p>
                    <p className="text-white font-medium">{booking.event.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Date</p>
                    <p className="text-white font-medium">
                      {new Date(booking.event.start_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Nombre de billets</p>
                    <p className="text-white font-medium">{booking.tickets.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Montant payé</p>
                    <p className="text-white font-medium">{booking.total_amount.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-1">
                      Vos billets ont été envoyés par email
                    </p>
                    <p className="text-sm text-blue-200/70">
                      Vérifiez votre boîte mail à {booking.customer_email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger les billets
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                >
                  Retour à l'accueil
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Présentez vos billets QR code à l'entrée de l'événement
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-slate-400">
            Gënaa Wóor! Merci d'avoir choisi EvenPass
          </p>
        </div>
      </div>
    </div>
  );
}
