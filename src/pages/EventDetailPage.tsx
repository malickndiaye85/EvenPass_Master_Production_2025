import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ShoppingCart, Minus, Plus, X, Star, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import DynamicLogo from '../components/DynamicLogo';
import type { Event, TicketType, CartItem, CheckoutForm } from '../types';

const generateBookingNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
};

const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TK-${timestamp}-${random}`;
};

const generateQRCode = () => {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
};

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    payment_method: 'wave',
  });
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [checkingPhone, setCheckingPhone] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [slug]);

  const loadEvent = async () => {
    try {
      console.log('=== CHARGEMENT ÉVÉNEMENT ===');
      console.log('Slug recherché:', slug);

      const eventsRef = collection(firestore, 'events');
      const q = query(eventsRef, where('slug', '==', slug), where('status', '==', 'published'));
      const eventSnapshot = await getDocs(q);

      if (eventSnapshot.empty) {
        console.log('❌ Aucun événement trouvé avec ce slug et status=published');
        console.log('Recherche sans filtre status...');
        const qAll = query(eventsRef, where('slug', '==', slug));
        const allSnapshot = await getDocs(qAll);
        if (!allSnapshot.empty) {
          console.log('⚠️ Événement trouvé mais status:', allSnapshot.docs[0].data().status);
          console.log('Pour voir l\'événement, changez le status en "published" dans Firebase');
        }
        return;
      }

      const eventData = { id: eventSnapshot.docs[0].id, ...eventSnapshot.docs[0].data() } as any;
      console.log('✅ Événement trouvé:', eventData.title);
      console.log('📋 Event ID:', eventData.id);
      console.log('📋 Status:', eventData.status);

      if (eventData.category_id) {
        const categoryDoc = await getDoc(doc(firestore, 'event_categories', eventData.category_id));
        eventData.category = categoryDoc.exists() ? { id: categoryDoc.id, ...categoryDoc.data() } : null;
      }

      if (eventData.organizer_id) {
        const organizerDoc = await getDoc(doc(firestore, 'organizers', eventData.organizer_id));
        eventData.organizer = organizerDoc.exists() ? { id: organizerDoc.id, ...organizerDoc.data() } : null;
      }

      console.log('🎫 Recherche des billets pour event_id:', eventData.id);
      const ticketTypesRef = collection(firestore, 'ticket_types');
      const ticketTypesQuery = query(ticketTypesRef, where('event_id', '==', eventData.id));
      const ticketTypesSnapshot = await getDocs(ticketTypesQuery);

      console.log('📊 Nombre de billets trouvés:', ticketTypesSnapshot.docs.length);

      if (ticketTypesSnapshot.empty) {
        console.log('❌ AUCUN BILLET TROUVÉ!');
        console.log('');
        console.log('🔍 DIAGNOSTIC:');
        console.log('1. Allez dans Firebase Console → Firestore Database');
        console.log('2. Ouvrez la collection "ticket_types"');
        console.log('3. Cherchez des documents avec event_id =', eventData.id);
        console.log('');
        console.log('Si aucun document n\'existe, l\'organisateur doit recréer l\'événement');
        console.log('ou créer les billets manuellement dans Firebase.');
      } else {
        ticketTypesSnapshot.docs.forEach((doc, index) => {
          console.log(`Billet ${index + 1}:`, {
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price,
            quantity_total: doc.data().quantity_total,
            quantity_sold: doc.data().quantity_sold,
            is_active: doc.data().is_active,
            event_id: doc.data().event_id
          });
        });
      }

      eventData.ticket_types = ticketTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        quantity_sold: doc.data().quantity_sold || 0,
        is_active: doc.data().is_active !== false
      }));

      console.log('=== FIN CHARGEMENT ===');
      setEvent(eventData as Event);
    } catch (error) {
      console.error('❌ ERREUR:', error);
      alert('Erreur lors du chargement de l\'événement. Consultez la console (F12) pour plus de détails.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (ticketType: TicketType) => {
    const existingItem = cart.find(item => item.ticket_type.id === ticketType.id);
    if (existingItem) {
      updateQuantity(ticketType.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        ticket_type: ticketType,
        quantity: 1,
        subtotal: ticketType.price,
      }]);
    }
  };

  const updateQuantity = (ticketTypeId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.ticket_type.id !== ticketTypeId));
    } else if (newQuantity > 3) {
      alert('Maximum 3 billets par catégorie');
      return;
    } else {
      setCart(cart.map(item =>
        item.ticket_type.id === ticketTypeId
          ? { ...item, quantity: newQuantity, subtotal: item.ticket_type.price * newQuantity }
          : item
      ));
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (!event || cart.length === 0) return;

    if (!checkoutForm.customer_phone) {
      alert('Veuillez saisir votre numéro de téléphone');
      return;
    }

    if (contactMethod === 'email' && !checkoutForm.customer_email) {
      alert('Veuillez saisir votre adresse email');
      return;
    }

    setProcessing(true);
    setCheckingPhone(true);

    try {
      const bookingsRef = collection(firestore, 'bookings');
      const existingBookingsQuery = query(
        bookingsRef,
        where('event_id', '==', event.id),
        where('customer_phone', '==', checkoutForm.customer_phone),
        where('status', 'in', ['confirmed', 'pending'])
      );
      const existingBookingsSnapshot = await getDocs(existingBookingsQuery);

      if (!existingBookingsSnapshot.empty) {
        setProcessing(false);
        setCheckingPhone(false);
        alert('⚠️ Ce numéro de téléphone a déjà effectué un achat pour cet événement.\n\nLimite : 1 transaction par numéro pour éviter les abus.\n\nSi vous avez besoin d\'aide, contactez le support.');
        return;
      }

      setCheckingPhone(false);

      const bookingNumber = generateBookingNumber();
      const bookingData = {
        booking_number: bookingNumber,
        event_id: event.id,
        total_amount: totalAmount,
        customer_name: checkoutForm.customer_name,
        customer_email: checkoutForm.customer_email,
        customer_phone: checkoutForm.customer_phone,
        payment_method: checkoutForm.payment_method,
        status: 'pending',
        currency: 'XOF',
        expires_at: Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      const bookingRef = await addDoc(collection(firestore, 'bookings'), bookingData);

      const ticketsToCreate = [];
      for (const cartItem of cart) {
        for (let i = 0; i < cartItem.quantity; i++) {
          const ticketNumber = generateTicketNumber();
          const qrCode = generateQRCode();

          ticketsToCreate.push({
            ticket_number: ticketNumber,
            qr_code: qrCode,
            booking_id: bookingRef.id,
            event_id: event.id,
            ticket_type_id: cartItem.ticket_type.id,
            holder_name: checkoutForm.customer_name,
            holder_email: checkoutForm.customer_email,
            price_paid: cartItem.ticket_type.price,
            status: 'pending',
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          });
        }
      }

      for (const ticket of ticketsToCreate) {
        await addDoc(collection(firestore, 'tickets'), ticket);
      }

      if (checkoutForm.payment_method === 'wave') {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/wave-checkout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totalAmount,
            currency: 'XOF',
            metadata: {
              bookingNumber: bookingNumber,
              bookingId: bookingRef.id,
              eventId: event.id,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initiate Wave payment');
        }

        const data = await response.json();

        await addDoc(collection(firestore, 'payments'), {
          booking_id: bookingRef.id,
          payment_reference: data.session_id,
          payment_method: checkoutForm.payment_method,
          amount: totalAmount,
          currency: 'XOF',
          phone_number: checkoutForm.customer_phone,
          status: 'pending',
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        window.location.href = data.checkout_url;
      } else {
        const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        await addDoc(collection(firestore, 'payments'), {
          booking_id: bookingRef.id,
          payment_reference: paymentReference,
          payment_method: checkoutForm.payment_method,
          amount: totalAmount,
          currency: 'XOF',
          phone_number: checkoutForm.customer_phone,
          status: 'completed',
          paid_at: Timestamp.now(),
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        await updateDoc(doc(firestore, 'bookings', bookingRef.id), {
          status: 'confirmed',
          updated_at: Timestamp.now(),
        });

        for (const ticket of ticketsToCreate) {
          const ticketsRef = collection(firestore, 'tickets');
          const ticketQuery = query(
            ticketsRef,
            where('booking_id', '==', bookingRef.id),
            where('qr_code', '==', ticket.qr_code)
          );
          const ticketSnapshot = await getDocs(ticketQuery);
          if (!ticketSnapshot.empty) {
            await updateDoc(doc(firestore, 'tickets', ticketSnapshot.docs[0].id), {
              status: 'valid',
              updated_at: Timestamp.now(),
            });
          }
        }

        navigate(`/success?booking=${bookingNumber}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      navigate('/error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-white'} flex items-center justify-center`}>
        <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin ${
          isDark ? 'border-amber-600' : 'border-orange-500'
        }`}></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#050505]' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Événement non trouvé
          </h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-bold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? 'bg-[#050505]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isDark ? 'bg-black/40' : 'bg-white/40'
      } backdrop-blur-xl border-b ${isDark ? 'border-amber-900/20' : 'border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-amber-900/20 hover:bg-amber-800/30 text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Retour</span>
            </button>
            <DynamicLogo />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className={`relative h-[500px] rounded-[32px] overflow-hidden mb-6 ${
              isDark ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40' : 'bg-gradient-to-br from-slate-200 to-slate-300'
            }`}>
              {event.event_image_url ? (
                <>
                  <img
                    src={event.event_image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      console.error('Failed to load image:', event.event_image_url);
                    }}
                  />
                  <div className={`absolute inset-0 ${
                    isDark
                      ? 'bg-gradient-to-t from-black via-black/20 to-transparent'
                      : 'bg-gradient-to-t from-white via-white/20 to-transparent'
                  }`}></div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className={`w-32 h-32 ${isDark ? 'text-amber-700/40' : 'text-slate-400'}`} />
                </div>
              )}

              <div className="absolute top-6 right-6 flex flex-col gap-2">
                {event.is_featured && (
                  <div className={`px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg flex items-center backdrop-blur-xl ${
                    isDark
                      ? 'bg-amber-600/90 text-black'
                      : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  }`}>
                    <Star className="w-4 h-4 mr-1.5 fill-current" />
                    À LA UNE
                  </div>
                )}
              </div>

              <div className="absolute bottom-6 left-6">
                <span
                  className="px-5 py-2.5 text-sm font-black rounded-2xl shadow-lg backdrop-blur-xl"
                  style={{
                    backgroundColor: event.category?.color || '#FF6B35',
                    color: 'white',
                  }}
                >
                  {event.category?.name_fr}
                </span>
              </div>
            </div>

            <div className={`rounded-[32px] p-8 border ${
              isDark
                ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/40'
                : 'bg-white border-slate-200 shadow-lg'
            }`}>
              <h1 className={`text-4xl font-black mb-6 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {event.title}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className={`flex items-start gap-4 p-4 rounded-2xl ${
                  isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                }`}>
                  <div className={`p-3 rounded-xl ${
                    isDark ? 'bg-amber-600/20' : 'bg-orange-100'
                  }`}>
                    <Calendar className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-amber-500' : 'text-slate-500'}`}>
                      Date
                    </p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {new Date(event.start_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-2xl ${
                  isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                }`}>
                  <div className={`p-3 rounded-xl ${
                    isDark ? 'bg-amber-600/20' : 'bg-orange-100'
                  }`}>
                    <Clock className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-amber-500' : 'text-slate-500'}`}>
                      Heure
                    </p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-2xl ${
                  isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                }`}>
                  <div className={`p-3 rounded-xl ${
                    isDark ? 'bg-amber-600/20' : 'bg-orange-100'
                  }`}>
                    <MapPin className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-amber-500' : 'text-slate-500'}`}>
                      Lieu
                    </p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {event.venue_name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                      {event.venue_city}
                    </p>
                  </div>
                </div>

                {event.capacity && (
                  <div className={`flex items-start gap-4 p-4 rounded-2xl ${
                    isDark ? 'bg-amber-900/20' : 'bg-orange-50'
                  }`}>
                    <div className={`p-3 rounded-xl ${
                      isDark ? 'bg-amber-600/20' : 'bg-orange-100'
                    }`}>
                      <Users className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-amber-500' : 'text-slate-500'}`}>
                        Capacité
                      </p>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {event.capacity} places
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div>
                  <h2 className={`text-2xl font-black mb-4 flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Sparkles className="w-6 h-6" />
                    À propos
                  </h2>
                  <p className={`leading-relaxed whitespace-pre-line ${
                    isDark ? 'text-amber-100/80' : 'text-slate-600'
                  }`}>
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className={`rounded-[32px] p-6 border sticky top-24 ${
              isDark
                ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/40'
                : 'bg-white border-slate-200 shadow-lg'
            }`}>
              <h2 className={`text-2xl font-black mb-6 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <ShoppingCart className="w-6 h-6" />
                ACHETER VOS BILLETS
              </h2>

              {event.is_free ? (
                <div className="text-center py-8">
                  <p className="text-2xl font-bold text-green-500 mb-4">Événement GRATUIT</p>
                  <button className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold">
                    S'inscrire
                  </button>
                </div>
              ) : (
                <>
                  {!event.ticket_types || event.ticket_types.length === 0 ? (
                    <div className="text-center py-8">
                      <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-amber-400' : 'text-slate-700'}`}>
                        Aucun billet disponible pour le moment
                      </p>
                      <p className={`text-sm ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                        Les billets seront bientôt en vente
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {event.ticket_types.filter(t => t.is_active !== false).map((ticketType) => (
                      <div
                        key={ticketType.id}
                        className={`rounded-2xl p-5 border-2 transition-all ${
                          cart.find(item => item.ticket_type.id === ticketType.id)
                            ? isDark
                              ? 'border-amber-600 bg-amber-900/20'
                              : 'border-orange-500 bg-orange-50'
                            : isDark
                              ? 'border-amber-800/40 bg-amber-950/20'
                              : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className={`font-black text-lg ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {ticketType.name}
                            </h3>
                            {ticketType.description && (
                              <p className={`text-sm mt-1 ${
                                isDark ? 'text-amber-400/60' : 'text-slate-500'
                              }`}>
                                {ticketType.description}
                              </p>
                            )}
                          </div>
                          <p className={`text-2xl font-black ${
                            isDark ? 'text-amber-400' : 'text-orange-600'
                          }`}>
                            {ticketType.price.toLocaleString()} F
                          </p>
                        </div>

                        {cart.find(item => item.ticket_type.id === ticketType.id) ? (
                          <div className="flex items-center justify-between mt-4">
                            <button
                              onClick={() => updateQuantity(ticketType.id, cart.find(item => item.ticket_type.id === ticketType.id)!.quantity - 1)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
                                isDark
                                  ? 'bg-amber-900/40 hover:bg-amber-800/60 text-white'
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              }`}
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className={`text-2xl font-black ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {cart.find(item => item.ticket_type.id === ticketType.id)?.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(ticketType.id, cart.find(item => item.ticket_type.id === ticketType.id)!.quantity + 1)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
                                cart.find(item => item.ticket_type.id === ticketType.id)!.quantity >= 3
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              } ${
                                isDark
                                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                                  : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                              }`}
                              disabled={cart.find(item => item.ticket_type.id === ticketType.id)!.quantity >= 3}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(ticketType)}
                            className={`w-full mt-4 px-6 py-3 rounded-xl transition-all font-bold ${
                              ticketType.quantity_sold >= ticketType.quantity_total
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            } ${
                              isDark
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                                : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                            }`}
                            disabled={ticketType.quantity_sold >= ticketType.quantity_total}
                          >
                            {ticketType.quantity_sold >= ticketType.quantity_total ? 'Épuisé' : 'Ajouter au panier'}
                          </button>
                        )}

                        <p className={`text-xs mt-3 ${
                          isDark ? 'text-amber-400/60' : 'text-slate-500'
                        }`}>
                          {ticketType.quantity_total - ticketType.quantity_sold} places restantes • Max 3 billets
                        </p>
                      </div>
                        ))}
                      </div>

                      {cart.length > 0 && (
                        <>
                          <div className={`border-t pt-4 mb-6 ${
                            isDark ? 'border-amber-800/40' : 'border-slate-200'
                          }`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`font-semibold ${
                                isDark ? 'text-amber-400/80' : 'text-slate-600'
                              }`}>
                                Total
                              </span>
                              <span className={`text-3xl font-black ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}>
                                {totalAmount.toLocaleString()} FCFA
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setShowCheckout(true)}
                            className={`w-full px-6 py-4 rounded-2xl transition-all font-black text-lg shadow-xl ${
                              isDark
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black hover:shadow-amber-900/40'
                                : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white hover:shadow-orange-500/30'
                            }`}
                          >
                            Acheter maintenant
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-[32px] max-w-lg w-full max-h-[90vh] overflow-y-auto border ${
            isDark
              ? 'bg-gradient-to-br from-amber-950/95 to-orange-950/95 border-amber-800/40'
              : 'bg-white border-slate-200'
          }`}>
            <div className={`sticky top-0 p-6 border-b flex justify-between items-center ${
              isDark
                ? 'bg-amber-950/95 backdrop-blur-xl border-amber-800/40'
                : 'bg-white backdrop-blur-xl border-slate-200'
            }`}>
              <h2 className={`text-2xl font-black ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Paiement Mobile Money
              </h2>
              <button
                onClick={() => setShowCheckout(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark
                    ? 'hover:bg-amber-900/40 text-amber-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
                disabled={processing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-3 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Recevoir les billets par
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setContactMethod('whatsapp')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      contactMethod === 'whatsapp'
                        ? 'border-green-500 bg-green-500/20'
                        : isDark
                          ? 'border-amber-800/40 hover:border-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-3xl mb-2">💬</div>
                    <div className={`font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      WhatsApp
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-amber-400/60' : 'text-slate-500'
                    }`}>
                      Recommandé
                    </div>
                  </button>
                  <button
                    onClick={() => setContactMethod('email')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      contactMethod === 'email'
                        ? 'border-blue-500 bg-blue-500/20'
                        : isDark
                          ? 'border-amber-800/40 hover:border-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-3xl mb-2">✉️</div>
                    <div className={`font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      Email
                    </div>
                    <div className={`text-xs ${
                      isDark ? 'text-amber-400/60' : 'text-slate-500'
                    }`}>
                      Classique
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Numéro de téléphone {checkoutForm.payment_method === 'wave' ? 'Wave' : 'Orange Money'}
                </label>
                <input
                  type="tel"
                  value={checkoutForm.customer_phone}
                  onChange={(e) => {
                    const phone = e.target.value;
                    setCheckoutForm({
                      ...checkoutForm,
                      customer_phone: phone,
                      customer_name: phone || 'Client'
                    });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                    isDark
                      ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                  } focus:outline-none`}
                  placeholder="77 123 45 67"
                  disabled={processing}
                  required
                />
                <p className={`text-xs mt-2 ${isDark ? 'text-amber-400/60' : 'text-slate-500'}`}>
                  Utilisez votre numéro {checkoutForm.payment_method === 'wave' ? 'Wave' : 'Orange Money'}
                </p>
              </div>

              {contactMethod === 'email' && (
                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-amber-300' : 'text-slate-700'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={checkoutForm.customer_email}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors ${
                      isDark
                        ? 'bg-amber-950/40 border-amber-800/40 text-white focus:border-amber-600'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500'
                    } focus:outline-none`}
                    placeholder="email@exemple.com"
                    disabled={processing}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-bold mb-3 ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Méthode de paiement
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCheckoutForm({ ...checkoutForm, payment_method: 'wave' })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      checkoutForm.payment_method === 'wave'
                        ? 'border-blue-500 bg-blue-500/20'
                        : isDark
                          ? 'border-amber-800/40 hover:border-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={processing}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <img src="/Wave.svg" alt="Wave" className="h-12 w-auto" />
                      <div className={`font-bold text-sm ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        Wave
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setCheckoutForm({ ...checkoutForm, payment_method: 'orange_money' })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      checkoutForm.payment_method === 'orange_money'
                        ? 'border-orange-500 bg-orange-500/20'
                        : isDark
                          ? 'border-amber-800/40 hover:border-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={processing}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <img src="/Orange-Money.svg" alt="Orange Money" className="h-12 w-auto" />
                      <div className={`font-bold text-sm ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        Orange Money
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark
                  ? 'bg-amber-900/20 border-amber-800/40'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <p className={`text-sm font-medium ${
                  isDark ? 'text-amber-300' : 'text-orange-800'
                }`}>
                  <strong>Limite:</strong> Maximum 3 billets par numéro de téléphone
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing || checkingPhone}
                className={`w-full px-6 py-4 rounded-2xl transition-all font-black text-lg shadow-xl flex items-center justify-center gap-2 ${
                  processing || checkingPhone
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                }`}
              >
                {processing || checkingPhone ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {checkingPhone ? 'Vérification...' : 'Traitement...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Acheter - {totalAmount.toLocaleString()} FCFA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
