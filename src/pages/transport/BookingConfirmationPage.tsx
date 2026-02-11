import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, MapPin, Clock, Users, Navigation, Download, ArrowLeft, Sparkles } from 'lucide-react';
import QRCode from 'react-qr-code';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';
import DynamicLogo from '../../components/DynamicLogo';

interface BookingDetails {
  id: string;
  tripId: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  phoneNumber: string;
  totalAmount: number;
  driverName: string;
  status: string;
  paymentStatus: string;
}

export default function BookingConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    } else {
      navigate('/voyage/allodakar');
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      if (!bookingId) return;

      const bookingRef = doc(firestore, 'bookings', bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (bookingSnap.exists()) {
        setBooking({ id: bookingSnap.id, ...bookingSnap.data() } as BookingDetails);
      } else {
        console.error('[BOOKING] Booking not found');
        navigate('/voyage/allodakar');
      }
    } catch (error) {
      console.error('[BOOKING] Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `sama-pass-${bookingId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1A2332] to-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1A2332] to-[#0F1419] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Réservation introuvable</p>
          <button
            onClick={() => navigate('/voyage/allodakar')}
            className="bg-[#10B981] text-white px-6 py-3 rounded-xl font-bold"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const qrData = JSON.stringify({
    type: 'allodakar_booking',
    bookingId: booking.id,
    tripId: booking.tripId,
    seats: booking.seats,
    phone: booking.phoneNumber,
    timestamp: Date.now()
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1A2332] to-[#0F1419]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/voyage/allodakar')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-all mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <div className="mb-8 text-center">
          <DynamicLogo className="mx-auto mb-4" size="md" />
        </div>

        <div className="bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 rounded-3xl p-6 border-2 border-[#10B981]/50 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CheckCircle className="w-10 h-10 text-[#10B981]" />
            <h1 className="text-3xl font-black text-white">Réservation confirmée !</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Votre Sama Pass est prêt
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-3xl p-8 border-2 border-[#10B981]/30 shadow-2xl mb-6">
          <div className="bg-white p-6 rounded-2xl mb-6">
            <div id="qr-code-svg">
              <QRCode
                value={qrData}
                size={256}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>

          <button
            onClick={downloadQRCode}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mb-6 border border-white/20"
          >
            <Download className="w-5 h-5" />
            Télécharger le QR Code
          </button>

          <div className="bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 rounded-2xl p-5 border border-[#10B981]/30 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#10B981]" />
                <span className="text-lg font-bold text-white">{booking.departure}</span>
              </div>
              <Navigation className="w-5 h-5 text-cyan-400" />
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{booking.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-gray-400">Heure</div>
                <div className="text-lg font-bold text-white">{booking.time}</div>
              </div>
              <div>
                <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-gray-400">Places</div>
                <div className="text-lg font-bold text-white">{booking.seats}</div>
              </div>
              <div>
                <Sparkles className="w-5 h-5 text-[#10B981] mx-auto mb-1" />
                <div className="text-sm text-gray-400">Total</div>
                <div className="text-lg font-bold text-[#10B981]">{booking.totalAmount.toLocaleString()} F</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border-2 border-yellow-500/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-black text-white">
                Gënaa Wóor, Gënaa Gaaw, Gënaa Yomb
              </h2>
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-yellow-200 text-sm font-semibold">
              Voyagez mieux, voyagez plus vite, voyagez loin
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            Instructions
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">1.</span>
              <span>Présentez ce QR Code au chauffeur avant le départ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">2.</span>
              <span>Arrivez 10 minutes avant l'heure de départ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">3.</span>
              <span>Le QR Code a été envoyé à votre numéro : {booking.phoneNumber}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">4.</span>
              <span>En cas de problème, contactez le support</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/voyage/allodakar')}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-all border border-white/20"
          >
            Nouveau trajet
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-4 rounded-xl font-bold hover:shadow-2xl transition-all"
          >
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}
