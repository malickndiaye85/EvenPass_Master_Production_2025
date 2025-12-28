import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Search,
  Ticket,
  Plus,
  Scan,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/SupabaseAuthContext';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  EvenPass
                </h1>
                <p className="text-xs text-slate-500">La billetterie premium du Sénégal</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/organizer/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all font-medium shadow-lg shadow-orange-500/30"
            >
              Connexion
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-pink-500/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 mb-6">
              <Zap className="w-4 h-4 text-orange-400 mr-2" />
              <span className="text-sm text-slate-300">Nouvelle expérience de billetterie</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="block">Gënaa Yomb</span>
              <span className="block bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Gënaa Wóor
              </span>
              <span className="block">Gënaa Gaaw</span>
            </h2>

            <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto">
              La plateforme premium pour découvrir et réserver vos événements au Sénégal
            </p>
            <p className="text-sm text-slate-400 mb-12">
              Concerts • Lutte • Théâtre • Sport • Culture
            </p>

            <div className="max-w-3xl mx-auto relative mb-12">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Rechercher un événement, artiste ou lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-2xl text-white text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <button
                onClick={() => navigate('/')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-pink-500/10 transition-all"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Ticket className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Acheter des billets</h3>
                  <p className="text-sm text-slate-400">Découvrez et réservez vos événements</p>
                  <ArrowRight className="w-5 h-5 text-orange-400 mx-auto mt-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => user?.role === 'organizer' ? navigate('/organizer/dashboard') : alert('Connectez-vous en tant qu\'organisateur')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Créer un événement</h3>
                  <p className="text-sm text-slate-400">Organisez votre prochain événement</p>
                  <ArrowRight className="w-5 h-5 text-blue-400 mx-auto mt-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => navigate('/scan')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Scan className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Scanner des billets</h3>
                  <p className="text-sm text-slate-400">Contrôlez les accès événements</p>
                  <ArrowRight className="w-5 h-5 text-green-400 mx-auto mt-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-950 to-slate-900 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8 text-slate-400 text-sm">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-500" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              <span>+10,000 utilisateurs</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-orange-500" />
              <span>Billetterie premium</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-white">Parcourir par catégorie</h3>
          </div>

          <div className="flex flex-wrap gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`group relative px-8 py-3 rounded-xl font-semibold transition-all ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span className="relative z-10">Tous les événements</span>
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative px-8 py-3 rounded-xl font-semibold transition-all border ${
                  selectedCategory === category.id
                    ? 'text-white scale-105 shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  borderColor: selectedCategory === category.id ? category.color : undefined,
                  boxShadow: selectedCategory === category.id ? `0 10px 30px -10px ${category.color}50` : undefined,
                }}
              >
                <span className="relative z-10">{category.name_fr}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Chargement des événements...</p>
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
                      className="group relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-orange-500 transition-all cursor-pointer hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2"
                      onClick={() => navigate(`/event/${event.slug}`)}
                    >
                      <div className="relative h-56 bg-slate-700 overflow-hidden">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                            <Calendar className="w-20 h-20 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60"></div>

                        {event.is_featured && (
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            À LA UNE
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="px-3 py-1 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm"
                              style={{
                                backgroundColor: event.category?.color || '#FF6B35',
                                color: 'white',
                              }}
                            >
                              {event.category?.name_fr}
                            </span>
                            {event.is_free && (
                              <span className="px-3 py-1 text-xs font-bold bg-green-600 text-white rounded-full shadow-lg">
                                GRATUIT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors">
                          {event.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-slate-400">
                            <Calendar className="w-4 h-4 mr-3 text-orange-500 flex-shrink-0" />
                            <span className="font-medium">
                              {new Date(event.start_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-slate-400">
                            <Clock className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                            <span className="font-medium">
                              {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-slate-400">
                            <MapPin className="w-4 h-4 mr-3 text-red-500 flex-shrink-0" />
                            <span className="font-medium">{event.venue_name}, {event.venue_city}</span>
                          </div>
                        </div>

                        {!event.is_free && minPrice > 0 && (
                          <div className="pt-4 border-t border-slate-700">
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-xs text-slate-400 mb-1">À partir de</p>
                                <p className="text-2xl font-black text-transparent bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text">
                                  {minPrice.toLocaleString()} FCFA
                                </p>
                              </div>
                              <button className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold text-sm hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-500/30 group-hover:scale-105">
                                Réserver
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-full mb-6">
                    <Calendar className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-300 mb-2">Aucun événement trouvé</h3>
                  <p className="text-slate-500">Essayez de modifier vos critères de recherche ou votre catégorie</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="bg-slate-950 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                    EvenPass
                  </h1>
                  <p className="text-xs text-slate-500">Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                La plateforme premium de billetterie événementielle au Sénégal.
                Découvrez, réservez et vivez des expériences uniques.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Accès Rapide</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate('/')} className="text-slate-400 hover:text-orange-400 transition-colors">
                    Événements
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/organizer/dashboard')} className="text-slate-400 hover:text-orange-400 transition-colors">
                    Dashboard Organisateur
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/scan')} className="text-slate-400 hover:text-orange-400 transition-colors">
                    Scanner
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Administration</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate('/admin/finance')} className="text-slate-400 hover:text-orange-400 transition-colors">
                    Admin Finance
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/admin/ops')} className="text-slate-400 hover:text-orange-400 transition-colors">
                    Ops Manager
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-500 text-sm mb-4 md:mb-0">
                &copy; 2025 EvenPass. Tous droits réservés.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Conditions d'utilisation
                </a>
                <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Confidentialité
                </a>
                <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
