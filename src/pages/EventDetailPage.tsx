import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Event, TicketType, CartItem, CheckoutForm } from '../types';

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          category:event_categories(*),
          organizer:organizers(*),
          ticket_types(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setEvent(data as Event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
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
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('event_id', event.id)
        .eq('customer_phone', checkoutForm.customer_phone)
        .in('status', ['confirmed', 'pending']);

      if (checkError) throw checkError;

      if (existingBookings && existingBookings.length > 0) {
        setProcessing(false);
        setCheckingPhone(false);
        alert('⚠️ Ce numéro de téléphone a déjà effectué un achat pour cet événement.\n\nLimite : 1 transaction par numéro pour éviter les abus.\n\nSi vous avez besoin d\'aide, contactez le support.');
        return;
      }

      setCheckingPhone(false);

      const { data: bookingNumber } = await supabase.rpc('generate_booking_number');

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          event_id: event.id,
          total_amount: totalAmount,
          customer_name: checkoutForm.customer_name,
          customer_email: checkoutForm.customer_email,
          customer_phone: checkoutForm.customer_phone,
          payment_method: checkoutForm.payment_method,
          status: 'pending',
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const ticketsToCreate = [];
      for (const cartItem of cart) {
        for (let i = 0; i < cartItem.quantity; i++) {
          const { data: ticketNumber } = await supabase.rpc('generate_ticket_number');
          const { data: qrCode } = await supabase.rpc('generate_qr_code');

          ticketsToCreate.push({
            ticket_number: ticketNumber,
            qr_code: qrCode,
            booking_id: booking.id,
            event_id: event.id,
            ticket_type_id: cartItem.ticket_type.id,
            holder_name: checkoutForm.customer_name,
            holder_email: checkoutForm.customer_email,
            price_paid: cartItem.ticket_type.price,
            status: 'valid',
          });
        }
      }

      const { error: ticketsError } = await supabase
        .from('tickets')
        .insert(ticketsToCreate);

      if (ticketsError) throw ticketsError;

      const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          payment_reference: paymentReference,
          payment_method: checkoutForm.payment_method,
          amount: totalAmount,
          phone_number: checkoutForm.customer_phone,
          status: 'completed',
          paid_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      navigate(`/success?booking=${booking.booking_number}`);
    } catch (error) {
      console.error('Checkout error:', error);
      navigate('/error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Événement non trouvé</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-orange-400 transition-colors"
          >
            ← Retour aux événements
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="relative h-96 bg-slate-800 rounded-xl overflow-hidden mb-6">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="w-24 h-24 text-slate-600" />
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-3 py-1 text-sm font-medium rounded-full"
                  style={{
                    backgroundColor: event.category?.color || '#FF6B35',
                    color: 'white',
                  }}
                >
                  {event.category?.name_fr}
                </span>
                {event.is_featured && (
                  <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full">
                    À LA UNE
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">{event.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-slate-300">
                  <Calendar className="w-5 h-5 mr-3 text-orange-500" />
                  <div>
                    <p className="text-sm text-slate-400">Date</p>
                    <p className="font-medium">
                      {new Date(event.start_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-slate-300">
                  <Clock className="w-5 h-5 mr-3 text-orange-500" />
                  <div>
                    <p className="text-sm text-slate-400">Heure</p>
                    <p className="font-medium">
                      {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-slate-300">
                  <MapPin className="w-5 h-5 mr-3 text-orange-500" />
                  <div>
                    <p className="text-sm text-slate-400">Lieu</p>
                    <p className="font-medium">{event.venue_name}</p>
                    <p className="text-sm text-slate-400">{event.venue_city}</p>
                  </div>
                </div>

                {event.capacity && (
                  <div className="flex items-center text-slate-300">
                    <Users className="w-5 h-5 mr-3 text-orange-500" />
                    <div>
                      <p className="text-sm text-slate-400">Capacité</p>
                      <p className="font-medium">{event.capacity} places</p>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">À propos</h2>
                  <p className="text-slate-300 whitespace-pre-line">{event.description}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <ShoppingCart className="w-6 h-6 mr-2" />
                Réserver
              </h2>

              {event.is_free ? (
                <div className="text-center py-8">
                  <p className="text-2xl font-bold text-green-500 mb-4">Événement GRATUIT</p>
                  <button className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                    S'inscrire
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {event.ticket_types?.map((ticketType) => (
                      <div key={ticketType.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-white">{ticketType.name}</h3>
                            {ticketType.description && (
                              <p className="text-sm text-slate-400 mt-1">{ticketType.description}</p>
                            )}
                          </div>
                          <p className="text-xl font-bold text-orange-400">
                            {ticketType.price.toLocaleString()} FCFA
                          </p>
                        </div>

                        {cart.find(item => item.ticket_type.id === ticketType.id) ? (
                          <div className="flex items-center justify-between mt-3">
                            <button
                              onClick={() => updateQuantity(ticketType.id, cart.find(item => item.ticket_type.id === ticketType.id)!.quantity - 1)}
                              className="w-10 h-10 bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center justify-center text-white transition-colors"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="text-white font-bold text-lg">
                              {cart.find(item => item.ticket_type.id === ticketType.id)?.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(ticketType.id, cart.find(item => item.ticket_type.id === ticketType.id)!.quantity + 1)}
                              className="w-10 h-10 bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={cart.find(item => item.ticket_type.id === ticketType.id)!.quantity >= 3}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(ticketType)}
                            className="w-full mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                            disabled={ticketType.quantity_sold >= ticketType.quantity_total}
                          >
                            {ticketType.quantity_sold >= ticketType.quantity_total ? 'Épuisé' : 'Ajouter'}
                          </button>
                        )}

                        <p className="text-xs text-slate-400 mt-2">
                          {ticketType.quantity_total - ticketType.quantity_sold} places restantes • Max 3 billets/catégorie
                        </p>
                      </div>
                    ))}
                  </div>

                  {cart.length > 0 && (
                    <>
                      <div className="border-t border-slate-700 pt-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400">Total</span>
                          <span className="text-2xl font-bold text-white">
                            {totalAmount.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-bold text-lg"
                      >
                        Procéder au paiement
                      </button>
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
          <div className="bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Paiement</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-slate-400 hover:text-white transition-colors"
                disabled={processing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Recevoir les billets par *
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setContactMethod('whatsapp')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contactMethod === 'whatsapp'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-2xl mb-1">💬</div>
                    <div className="text-white font-bold text-sm">WhatsApp</div>
                    <div className="text-xs text-slate-400">Recommandé</div>
                  </button>
                  <button
                    onClick={() => setContactMethod('email')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      contactMethod === 'email'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-2xl mb-1">✉️</div>
                    <div className="text-white font-bold text-sm">Email</div>
                    <div className="text-xs text-slate-400">Alternative</div>
                  </button>
                </div>

                {contactMethod === 'whatsapp' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Numéro WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={checkoutForm.customer_phone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+221 77 123 45 67"
                      disabled={processing}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Vos billets seront envoyés sur WhatsApp
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse Email *
                    </label>
                    <input
                      type="email"
                      value={checkoutForm.customer_email}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="votre@email.com"
                      disabled={processing}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Vos billets seront envoyés par email
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <p className="text-sm font-semibold text-blue-400 mb-1">
                      Protection Anti-Raffle
                    </p>
                    <p className="text-xs text-slate-400">
                      • Maximum 3 billets par catégorie
                      <br />
                      • 1 transaction par numéro de téléphone
                      <br />
                      • Vérification automatique des achats
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Méthode de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCheckoutForm({ ...checkoutForm, payment_method: 'wave' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      checkoutForm.payment_method === 'wave'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-white font-bold">Wave</div>
                  </button>
                  <button
                    onClick={() => setCheckoutForm({ ...checkoutForm, payment_method: 'orange_money' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      checkoutForm.payment_method === 'orange_money'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    disabled={processing}
                  >
                    <div className="text-white font-bold">Orange Money</div>
                  </button>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-sm text-slate-400 mb-2">Récapitulatif</p>
                {cart.map((item) => (
                  <div key={item.ticket_type.id} className="flex justify-between text-white mb-1">
                    <span>{item.quantity}x {item.ticket_type.name}</span>
                    <span>{item.subtotal.toLocaleString()} FCFA</span>
                  </div>
                ))}
                <div className="border-t border-slate-600 mt-3 pt-3 flex justify-between items-center">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-orange-400">
                    {totalAmount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={
                  processing ||
                  !checkoutForm.customer_phone ||
                  (contactMethod === 'email' && !checkoutForm.customer_email)
                }
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingPhone ? 'Vérification...' : processing ? 'Traitement...' : 'Confirmer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
