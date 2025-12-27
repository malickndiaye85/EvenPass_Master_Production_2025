import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Event, TicketCategory } from '../types';
import { MapPin, Calendar, Clock, Users, ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import PaymentModal from './PaymentModal';

interface EventDetailPageProps {
  eventId: string;
  onNavigate: (page: string) => void;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ eventId, onNavigate }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [ticketCounts, setTicketCounts] = useState({
    standard: 0,
    vip: 0,
    vvip: 0,
  });

  const MAX_TICKETS_TOTAL = 3;

  useEffect(() => {
    try {
      const eventRef = ref(db, `evenpass/events/${eventId}`);
      onValue(
        eventRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setEvent({ id: eventId, ...data });
          }
          setLoading(false);
        },
        (error) => {
          console.log('Error loading event:', error.message);
          setLoading(false);
        }
      );
    } catch (error) {
      console.log('Firebase error:', error);
      setLoading(false);
    }
  }, [eventId]);

  const getTicketCategories = (): TicketCategory[] => {
    if (!event) return [];

    const categories: TicketCategory[] = [];

    if (event.standard || event.p1) {
      categories.push({
        name: 'Standard',
        price: event.standard || event.p1 || 0,
        available: true,
      });
    }

    if (event.vip || event.p2) {
      categories.push({
        name: 'VIP',
        price: event.vip || event.p2 || 0,
        available: true,
      });
    }

    if (event.vvip || event.p3) {
      categories.push({
        name: 'VVIP',
        price: event.vvip || event.p3 || 0,
        available: true,
      });
    }

    return categories;
  };

  const handleIncrement = (category: string) => {
    const currentCount = ticketCounts[category as keyof typeof ticketCounts];
    const totalTickets = getTotalTickets();
    if (totalTickets < MAX_TICKETS_TOTAL) {
      setTicketCounts({
        ...ticketCounts,
        [category]: currentCount + 1,
      });
    }
  };

  const handleDecrement = (category: string) => {
    const currentCount = ticketCounts[category as keyof typeof ticketCounts];
    if (currentCount > 0) {
      setTicketCounts({
        ...ticketCounts,
        [category]: currentCount - 1,
      });
    }
  };

  const getTotalAmount = (): number => {
    if (!event) return 0;

    let total = 0;
    const standardPrice = event.standard || event.p1 || 0;
    const vipPrice = event.vip || event.p2 || 0;
    const vvipPrice = event.vvip || event.p3 || 0;

    total += ticketCounts.standard * standardPrice;
    total += ticketCounts.vip * vipPrice;
    total += ticketCounts.vvip * vvipPrice;

    return total;
  };

  const getTotalTickets = (): number => {
    return ticketCounts.standard + ticketCounts.vip + ticketCounts.vvip;
  };

  const formatPrice = (price: number): string => {
    if (!price || isNaN(price)) return '0 FCFA';
    return `${price.toLocaleString()} FCFA`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 pt-24 px-6 flex items-center justify-center">
        <p className="text-2xl text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 pt-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl text-gray-600 dark:text-gray-400 mb-8">Événement non trouvé</p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-3 rounded-full font-black transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const categories = getTicketCategories();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 mb-8 font-bold transition-colors"
        >
          <ArrowLeft size={20} />
          Retour aux événements
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-96 object-cover rounded-3xl shadow-2xl"
            />
          </div>

          <div>
            <h1 className="text-5xl font-black mb-6 text-gray-900 dark:text-white">
              {event.name}
            </h1>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <MapPin className="text-orange-500" size={24} />
                <span className="text-lg font-medium">{event.venue}</span>
              </div>

              {event.date && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Calendar className="text-orange-500" size={24} />
                  <span className="text-lg font-medium">
                    {new Date(event.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Clock className="text-orange-500" size={24} />
                <span className="text-lg font-medium">19:00</span>
              </div>
            </div>

            {event.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-black mb-4 text-gray-900 dark:text-white">
                  Description
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-4xl font-black mb-8 text-gray-900 dark:text-white">
            Tarification & Billets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {categories.map((category) => {
              const categoryKey = category.name.toLowerCase() as keyof typeof ticketCounts;
              const count = ticketCounts[categoryKey];

              return (
                <div
                  key={category.name}
                  className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 transition-all hover:border-orange-500"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="text-3xl font-black text-orange-500">
                      {formatPrice(category.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleDecrement(categoryKey)}
                      disabled={count === 0}
                      className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700 transition-all font-black flex items-center justify-center"
                    >
                      <Minus size={20} />
                    </button>

                    <span className="text-3xl font-black w-12 text-center text-gray-900 dark:text-white">
                      {count}
                    </span>

                    <button
                      onClick={() => handleIncrement(categoryKey)}
                      disabled={getTotalTickets() >= MAX_TICKETS_TOTAL}
                      className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700 transition-all font-black flex items-center justify-center"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">
                    Maximum {MAX_TICKETS_TOTAL} billets au total
                  </p>
                </div>
              );
            })}
          </div>

          {getTotalTickets() > 0 && (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={28} />
                    <span className="text-2xl font-black">
                      {getTotalTickets()} Billet{getTotalTickets() > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-4xl font-black">{formatPrice(getTotalAmount())}</p>
                </div>

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-3 bg-white text-orange-500 hover:bg-gray-100 px-10 py-4 rounded-full font-black text-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <ShoppingCart size={24} />
                  COMMANDER
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        eventId={eventId}
        eventName={event?.name || ''}
        totalAmount={getTotalAmount()}
        ticketCounts={ticketCounts}
      />
    </div>
  );
};

export default EventDetailPage;
