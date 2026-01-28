import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  UserCircle,
  Zap,
  Shield,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Event, EventCategory } from '../types';

export default function HomePageNew() {
  const navigate = useNavigate();
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
      const categoriesRef = collection(firestore, 'event_categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const loadedCategories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventCategory[];
      setCategories(loadedCategories);

      const eventsRef = collection(firestore, 'events');
      let eventsQuery = query(eventsRef, where('status', '==', 'published'));
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
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      if (selectedCategory) {
        loadedEvents = loadedEvents.filter(event => event.category_id === selectedCategory);
      }

      setEvents(loadedEvents);
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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fef5f0 0%, #fdeee8 50%, #fce8e0 100%)' }}>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-8">
            <Zap size={16} className="text-orange-500" />
            <span className="text-sm text-gray-700 font-medium">Nouvelle expérience de billetterie</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
            Gënaa Wóor<br />
            Gënaa Gaaw<br />
            Gënaa Yomb
          </h1>

          <p className="text-2xl text-gray-700 mb-3 font-semibold">
            La plateforme premium pour vos événements au Sénégal
          </p>

          <p className="text-base text-gray-600 mb-12">
            Concerts • Lutte • Théâtre • Sport • Culture
          </p>

          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un événement, artiste ou lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-gray-200 shadow-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            <div
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer group border border-gray-100"
              onClick={() => {
                const eventsSection = document.getElementById('events-section');
                eventsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Ticket size={32} className="text-white" />
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">EVEN !</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Acheter des billets</h3>
              <p className="text-gray-600 text-sm mb-4">
                Découvrez et achetez vos billets pour les meilleurs événements
              </p>
              <ArrowRight size={20} className="text-orange-500 mx-auto" />
            </div>

            <div
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer group border border-gray-100"
              onClick={() => navigate('/organisateur')}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <UserCircle size={32} className="text-white" />
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">EVEN !</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Espace Organisateur</h3>
              <p className="text-gray-600 text-sm mb-4">
                Organisez et gérez vos événements en toute simplicité
              </p>
              <ArrowRight size={20} className="text-blue-500 mx-auto" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-green-500" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              <span>+10,000 utilisateurs</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" />
              <span>Billetterie premium</span>
            </div>
          </div>
        </div>
      </div>

      <div id="events-section" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-gray-900 mb-8">Parcourir par catégorie</h2>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Sparkles size={16} className="inline mr-2" />
                Tous
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name_fr}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-32">
              <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 text-lg font-medium text-gray-500">Chargement des événements...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const minPrice = event.ticket_types && event.ticket_types.length > 0
                    ? Math.min(...event.ticket_types.map(t => t.price))
                    : 0;

                  return (
                    <div
                      key={event.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-100"
                      onClick={() => navigate(`/event/${event.slug}`)}
                    >
                      <div className="aspect-[4/3] overflow-hidden relative">
                        {event.event_image_url ? (
                          <img
                            src={event.event_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Calendar size={48} className="text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                          {event.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} className="text-orange-500" />
                            <span>
                              {new Date(event.start_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={16} className="text-orange-500" />
                            <span>
                              {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={16} className="text-orange-500" />
                            <span className="line-clamp-1">
                              {event.venue_name}, {event.venue_city}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          {!event.is_free && minPrice > 0 ? (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">À partir de</p>
                                <span className="text-2xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                                  {minPrice.toLocaleString()} F
                                </span>
                              </div>
                              <button className="px-5 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold rounded-lg text-sm transition-all shadow-md">
                                ACHETER
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-3 py-1.5 bg-green-100 text-green-700 font-bold text-sm rounded-lg">
                                GRATUIT
                              </span>
                              <button className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-lg text-sm transition-all">
                                INSCRIPTION
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
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-6">
                    <Calendar size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Aucun événement trouvé</h3>
                  <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
