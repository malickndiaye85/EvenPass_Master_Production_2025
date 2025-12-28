import { useState, useEffect } from 'react';
import { Calendar, MapPin, Search, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Event, EventCategory } from '../types';

export default function HomePageNew() {
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
      const { data: categoriesData } = await supabase
        .from('event_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) setCategories(categoriesData);

      let query = supabase
        .from('events')
        .select(`
          *,
          category:event_categories(*),
          organizer:organizers(*),
          ticket_types(*)
        `)
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString())
        .order('start_date');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: eventsData } = await query.limit(12);

      if (eventsData) setEvents(eventsData as Event[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue_city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">EvenPass</h1>
                <p className="text-xs text-slate-400">Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
              Se connecter
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Découvrez les meilleurs événements
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Concerts, lutte, théâtre et plus encore au Sénégal
          </p>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un événement ou une ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedCategory === null
                ? 'bg-orange-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tous
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category.id
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              style={{
                backgroundColor: selectedCategory === category.id ? category.color : undefined,
              }}
            >
              {category.name_fr}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-orange-500 transition-all cursor-pointer group"
                onClick={() => window.location.href = `/event/${event.slug}`}
              >
                <div className="relative h-48 bg-slate-700">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-slate-600" />
                    </div>
                  )}
                  {event.is_featured && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
                      À LA UNE
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: event.category?.color || '#FF6B35',
                        color: 'white',
                      }}
                    >
                      {event.category?.name_fr}
                    </span>
                    {event.is_free && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full">
                        GRATUIT
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex items-center text-sm text-slate-400 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.start_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.venue_city}
                  </div>
                  {!event.is_free && event.ticket_types && event.ticket_types.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-sm text-slate-400">À partir de</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.min(...event.ticket_types.map(t => t.price)).toLocaleString()} FCFA
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Aucun événement trouvé</h3>
            <p className="text-slate-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>

      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-slate-400 text-sm">
            <p>&copy; 2025 EvenPass - La billetterie du Sénégal</p>
            <p className="mt-2">Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
