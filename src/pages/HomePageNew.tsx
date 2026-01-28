import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Search,
  Clock,
  Star,
  Flame,
  AlertCircle,
  Music,
  Trophy,
  Mic2,
  Utensils,
  Briefcase,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Event, EventCategory } from '../types';

export default function HomePageNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[FIREBASE] Loading categories and events from Firebase...');

      const categoriesRef = collection(firestore, 'event_categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const loadedCategories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventCategory[];
      setCategories(loadedCategories);

      const eventsRef = collection(firestore, 'events');
      let eventsQuery = query(
        eventsRef,
        where('status', '==', 'published')
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      let loadedEvents = await Promise.all(
        eventsSnapshot.docs.map(async (eventDoc) => {
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;

          const ticketTypesRef = collection(firestore, 'ticket_types');
          const ticketTypesQuery = query(ticketTypesRef, where('event_id', '==', eventData.id));
          const ticketTypesSnapshot = await getDocs(ticketTypesQuery);
          eventData.ticket_types = ticketTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          return eventData;
        })
      );

      loadedEvents = loadedEvents
        .filter(event => new Date(event.start_date) >= new Date())
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      if (selectedCategory) {
        loadedEvents = loadedEvents.filter(event => event.category_id === selectedCategory);
      }

      setEvents(loadedEvents);
      console.log('[FIREBASE] Loaded', loadedEvents.length, 'events and', loadedCategories.length, 'categories');
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue_city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (categoryName: string) => {
    if (!categoryName) return Sparkles;
    const name = categoryName.toLowerCase();
    if (name.includes('musique') || name.includes('music')) return Music;
    if (name.includes('sport')) return Trophy;
    if (name.includes('conférence') || name.includes('conference')) return Briefcase;
    if (name.includes('festival')) return PartyPopper;
    if (name.includes('théâtre') || name.includes('theater')) return Mic2;
    if (name.includes('gastronomie') || name.includes('food')) return Utensils;
    return Sparkles;
  };

  const getAvailabilityBadge = (event: Event) => {
    const totalTickets = event.ticket_types?.reduce((sum, t) => sum + t.quantity_available, 0) || 0;
    const soldTickets = event.ticket_types?.reduce((sum, t) => sum + (t.quantity_available - t.quantity_available), 0) || 0;
    const availabilityPercent = totalTickets > 0 ? ((totalTickets - soldTickets) / totalTickets) * 100 : 100;

    if (availabilityPercent < 10) {
      return { text: 'Dernières places', color: 'bg-red-500', icon: Flame };
    } else if (availabilityPercent < 30) {
      return { text: 'Bientôt complet', color: 'bg-orange-500', icon: AlertCircle };
    }
    return null;
  };

  const isNewEvent = (eventDate: string) => {
    const daysSinceCreation = (Date.now() - new Date(eventDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            className="text-2xl font-display font-bold text-gray-900 cursor-pointer"
            onClick={() => navigate('/')}
          >
            DEM⇄DEM
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-600">
              Nouvelle expérience
            </div>
            <button
              className="text-gray-600 hover:text-orange-600 font-medium text-sm transition-colors"
              onClick={() => navigate('/organisateur')}
            >
              Organisateur ?
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
            />
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Événements à Découvrir
          </h1>
          <p className="text-gray-600">
            Trouvez et réservez vos billets pour les meilleurs événements au Sénégal
          </p>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name_fr);
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  {category.name_fr}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-lg font-medium text-gray-500">
              Chargement des événements...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const minPrice = event.ticket_types && event.ticket_types.length > 0
                  ? Math.min(...event.ticket_types.map(t => t.price))
                  : 0;
                const availabilityBadge = getAvailabilityBadge(event);
                const isNew = isNewEvent(event.created_at || event.start_date);

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg group"
                    onClick={() => navigate(`/event/${event.slug}`)}
                  >
                    <div className="aspect-video overflow-hidden relative">
                      {event.event_image_url ? (
                        <img
                          src={event.event_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Calendar size={48} className="text-gray-400" />
                        </div>
                      )}

                      {(isNew || event.is_featured || availabilityBadge) && (
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {event.is_featured && (
                            <div className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg">
                              <Star size={12} className="fill-current" />
                              À LA UNE
                            </div>
                          )}
                          {isNew && (
                            <div className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg">
                              <Sparkles size={12} />
                              NOUVEAU
                            </div>
                          )}
                          {availabilityBadge && (
                            <div className={`${availabilityBadge.color} px-3 py-1 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg`}>
                              <availabilityBadge.icon size={12} />
                              {availabilityBadge.text}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={16} />
                          <span>
                            {new Date(event.start_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock size={16} />
                          <span>
                            {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin size={16} />
                          <span className="line-clamp-1">
                            {event.venue_name}, {event.venue_city}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        {!event.is_free && minPrice > 0 ? (
                          <>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">À partir de</p>
                              <span className="text-xl font-bold text-orange-600">
                                {minPrice.toLocaleString()} FCFA
                              </span>
                            </div>
                            <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors">
                              Acheter
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="px-3 py-1 bg-green-100 text-green-700 font-semibold text-sm rounded-lg">
                              GRATUIT
                            </span>
                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg text-sm transition-colors">
                              Inscription
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-32">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Aucun événement trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            )}
          </>
        )}

        <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
            Vous organisez un événement ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Créez, vendez et gérez vos billets en quelques clics. Tableau de bord en temps réel, paiements sécurisés.
          </p>
          <button
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            onClick={() => navigate('/organisateur')}
          >
            Devenir Organisateur →
          </button>
        </div>
      </div>
    </div>
  );
}
