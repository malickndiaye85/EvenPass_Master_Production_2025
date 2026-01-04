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
  Zap,
  Sun,
  Moon,
  Music,
  Trophy,
  Mic2,
  Utensils,
  Briefcase,
  PartyPopper,
  AlertCircle,
  Star,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { mockEvents, mockCategories } from '../lib/mockData';
import type { Event, EventCategory } from '../types';
import Logo from '../components/Logo';

export default function HomePageNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
      console.log('[MOCK DATA] Loading categories and events...');

      setCategories(mockCategories as EventCategory[]);

      let filteredEvents = mockEvents.filter(event =>
        event.status === 'published' &&
        new Date(event.start_date) >= new Date()
      );

      if (selectedCategory) {
        filteredEvents = filteredEvents.filter(event =>
          event.category_id === selectedCategory
        );
      }

      setEvents(filteredEvents as Event[]);
      console.log('[MOCK DATA] Loaded', filteredEvents.length, 'events');
    } catch (error) {
      console.error('Error loading data:', error);
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
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark
        ? 'bg-[#050505]'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isDark
          ? 'bg-black/60 border-amber-900/20'
          : 'bg-white/60 border-slate-200/60'
      } backdrop-blur-2xl border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Logo size="md" variant="default" />
              <p className={`text-xs font-medium ml-16 -mt-1 ${isDark ? 'text-amber-500/60' : 'text-slate-500'}`}>
                Premium Events • Sénégal
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/how-it-works')}
                className={`group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all overflow-hidden ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 hover:from-amber-800/40 hover:to-orange-800/40 text-amber-300 border border-amber-700/30'
                    : 'bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 text-orange-600 border border-orange-200/50'
                } hover:scale-105 hover:shadow-lg`}
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Comment ça marche</span>
                </span>
              </button>

              <button
                onClick={() => navigate('/for-organizers')}
                className={`group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all overflow-hidden ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 hover:from-blue-800/40 hover:to-cyan-800/40 text-blue-300 border border-blue-700/30'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 border border-blue-200/50'
                } hover:scale-105 hover:shadow-lg`}
              >
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Pour organisateurs</span>
                </span>
              </button>

              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? 'bg-amber-900/30 hover:bg-amber-800/40 text-amber-400 border border-amber-800/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50'
                }`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => navigate('/organizer/login')}
                className={`group relative px-6 py-2.5 rounded-xl font-black text-sm transition-all overflow-hidden shadow-lg hover:scale-105 ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black shadow-amber-600/30'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-orange-500/30'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Espace Organisateur</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-br from-amber-950/20 via-transparent to-orange-950/20'
            : 'bg-gradient-to-br from-orange-50 via-transparent to-pink-50'
        }`}></div>

        <div className="absolute inset-0" style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 20% 50%, rgba(217, 119, 6, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(234, 88, 12, 0.15) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className={`inline-flex items-center px-5 py-2.5 rounded-full border mb-8 ${
              isDark
                ? 'bg-amber-950/40 backdrop-blur-xl border-amber-800/40'
                : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg'
            }`}>
              <Zap className={`w-4 h-4 mr-2 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
              <span className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-slate-700'}`}>
                Nouvelle expérience de billetterie
              </span>
            </div>

            <h2 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span className="block animate-fade-in">Gënaa Yomb</span>
              <span className={`block animate-fade-in animation-delay-200 ${
                isDark
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent'
              }`}>
                Gënaa Wóor
              </span>
              <span className="block animate-fade-in animation-delay-400">Gënaa Gaaw</span>
            </h2>

            <p className={`text-xl sm:text-2xl mb-3 max-w-3xl mx-auto font-medium ${
              isDark ? 'text-amber-100/80' : 'text-slate-600'
            }`}>
              La plateforme premium pour vos événements au Sénégal
            </p>
            <p className={`text-sm mb-12 ${isDark ? 'text-amber-500/60' : 'text-slate-500'}`}>
              Concerts • Lutte • Théâtre • Sport • Culture
            </p>

            <div className="max-w-3xl mx-auto relative mb-16">
              <div className={`absolute -inset-1 rounded-[32px] blur-xl opacity-30 ${
                isDark
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                  : 'bg-gradient-to-r from-orange-400 to-pink-400'
              }`}></div>
              <div className="relative">
                <Search className={`absolute left-7 top-1/2 transform -translate-y-1/2 w-6 h-6 ${
                  isDark ? 'text-amber-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  placeholder="Rechercher un événement, artiste ou lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-16 pr-6 py-6 rounded-[32px] text-lg font-medium border-2 transition-all shadow-2xl backdrop-blur-xl focus:outline-none focus:scale-[1.02] ${
                    isDark
                      ? 'bg-black/40 border-amber-800/40 text-amber-50 placeholder-amber-500/40 focus:border-amber-600 focus:shadow-amber-900/40'
                      : 'bg-white/90 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-400 focus:shadow-orange-500/20'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
              <button
                onClick={() => navigate('/')}
                className={`group relative overflow-hidden p-10 transition-all duration-300 hover:scale-[1.05] border w-full sm:w-80 ${
                  isDark
                    ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40 hover:border-amber-600'
                    : 'bg-white/80 backdrop-blur-xl border-slate-200 hover:border-orange-300 shadow-lg hover:shadow-2xl'
                }`}
                style={{ borderRadius: '40px 120px 40px 120px' }}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDark
                    ? 'bg-gradient-to-br from-amber-600/10 to-orange-600/10'
                    : 'bg-gradient-to-br from-orange-100/50 to-pink-100/50'
                }`}></div>
                <div className="relative">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 ${
                    isDark
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-orange-500 to-red-600'
                  } shadow-xl`}>
                    <Ticket className="w-10 h-10 text-white" />
                  </div>
                  <h3 className={`text-xl font-black mb-3 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                    Acheter des billets
                  </h3>
                  <p className={`text-sm mb-5 ${isDark ? 'text-amber-300/60' : 'text-slate-600'}`}>
                    Découvrez et achetez vos billets pour les meilleurs événements
                  </p>
                  <ArrowRight className={`w-6 h-6 mx-auto group-hover:translate-x-2 transition-transform duration-300 ${
                    isDark ? 'text-amber-400' : 'text-orange-500'
                  }`} />
                </div>
              </button>

              <button
                onClick={() => user?.role === 'organizer' ? navigate('/organizer/dashboard') : navigate('/organizer/login')}
                className={`group relative overflow-hidden p-10 transition-all duration-300 hover:scale-[1.05] border w-full sm:w-80 ${
                  isDark
                    ? 'bg-gradient-to-br from-blue-950/40 to-cyan-950/40 backdrop-blur-xl border-blue-800/40 hover:border-blue-600'
                    : 'bg-white/80 backdrop-blur-xl border-slate-200 hover:border-blue-300 shadow-lg hover:shadow-2xl'
                }`}
                style={{ borderRadius: '40px 120px 40px 120px' }}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDark
                    ? 'bg-gradient-to-br from-blue-600/10 to-cyan-600/10'
                    : 'bg-gradient-to-br from-blue-100/50 to-cyan-100/50'
                }`}></div>
                <div className="relative">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 ${
                    isDark
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  } shadow-xl`}>
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                  <h3 className={`text-xl font-black mb-3 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                    Créer un événement
                  </h3>
                  <p className={`text-sm mb-5 ${isDark ? 'text-blue-300/60' : 'text-slate-600'}`}>
                    Organisez et gérez vos événements en toute simplicité
                  </p>
                  <ArrowRight className={`w-6 h-6 mx-auto group-hover:translate-x-2 transition-transform duration-300 ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`py-6 border-y ${
        isDark ? 'bg-black/40 border-amber-900/20' : 'bg-slate-50/50 border-slate-200/60'
      } backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center">
              <Shield className={`w-5 h-5 mr-2 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
              <span className={isDark ? 'text-amber-200/80' : 'text-slate-600'}>Paiement sécurisé</span>
            </div>
            <div className="flex items-center">
              <Users className={`w-5 h-5 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              <span className={isDark ? 'text-amber-200/80' : 'text-slate-600'}>+10,000 utilisateurs</span>
            </div>
            <div className="flex items-center">
              <Sparkles className={`w-5 h-5 mr-2 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
              <span className={isDark ? 'text-amber-200/80' : 'text-slate-600'}>Billetterie premium</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`py-16 ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className={`text-3xl font-black ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
              Parcourir par catégorie
            </h3>
          </div>

          <div className="flex flex-wrap gap-3 mb-16">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`group relative px-8 py-4 rounded-3xl font-bold transition-all duration-300 border ${
                selectedCategory === null
                  ? isDark
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-black border-transparent shadow-2xl shadow-amber-900/40 scale-105'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-2xl shadow-orange-500/30 scale-105'
                  : isDark
                    ? 'bg-amber-950/40 text-amber-200 border-amber-800/40 hover:bg-amber-900/40 hover:border-amber-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tous
              </span>
            </button>

            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name_fr);
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group relative px-8 py-4 rounded-3xl font-bold transition-all duration-300 border ${
                    selectedCategory === category.id
                      ? 'text-white scale-105 shadow-2xl border-transparent'
                      : isDark
                        ? 'bg-amber-950/40 text-amber-200 border-amber-800/40 hover:bg-amber-900/40 hover:border-amber-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : undefined,
                    boxShadow: selectedCategory === category.id ? `0 20px 40px -15px ${category.color}80` : undefined,
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {category.name_fr}
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center py-32">
              <div className={`inline-block w-20 h-20 border-4 border-t-transparent rounded-full animate-spin ${
                isDark ? 'border-amber-600' : 'border-orange-500'
              }`}></div>
              <p className={`mt-6 text-lg font-medium ${isDark ? 'text-amber-300/60' : 'text-slate-500'}`}>
                Chargement des événements...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => {
                  const minPrice = event.ticket_types && event.ticket_types.length > 0
                    ? Math.min(...event.ticket_types.map(t => t.price))
                    : 0;
                  const availabilityBadge = getAvailabilityBadge(event);
                  const isNew = isNewEvent(event.created_at || event.start_date);

                  return (
                    <div
                      key={event.id}
                      className={`group relative rounded-[32px] overflow-hidden border-2 transition-all duration-500 cursor-pointer hover:-translate-y-3 hover:shadow-2xl ${
                        isDark
                          ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40 hover:border-amber-600 hover:shadow-amber-900/40'
                          : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-orange-500/20'
                      }`}
                      onClick={() => navigate(`/event/${event.slug}`)}
                    >
                      <div className="relative h-64 bg-slate-700 overflow-hidden">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isDark ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40' : 'bg-gradient-to-br from-slate-200 to-slate-300'
                          }`}>
                            <Calendar className={`w-20 h-20 ${isDark ? 'text-amber-700/40' : 'text-slate-400'}`} />
                          </div>
                        )}
                        <div className={`absolute inset-0 ${
                          isDark
                            ? 'bg-gradient-to-t from-black via-black/50 to-transparent'
                            : 'bg-gradient-to-t from-white via-white/50 to-transparent'
                        } opacity-80`}></div>

                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          {event.is_featured && (
                            <div className={`px-4 py-2 rounded-2xl text-xs font-black shadow-lg flex items-center backdrop-blur-xl ${
                              isDark
                                ? 'bg-amber-600/90 text-black'
                                : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                            }`}>
                              <Star className="w-3 h-3 mr-1.5 fill-current" />
                              À LA UNE
                            </div>
                          )}
                          {isNew && (
                            <div className={`px-4 py-2 rounded-2xl text-xs font-black shadow-lg flex items-center backdrop-blur-xl ${
                              isDark
                                ? 'bg-green-600/90 text-black'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            }`}>
                              <Sparkles className="w-3 h-3 mr-1.5" />
                              NOUVEAU
                            </div>
                          )}
                          {availabilityBadge && (
                            <div className={`${availabilityBadge.color} px-4 py-2 rounded-2xl text-xs font-black text-white shadow-lg flex items-center backdrop-blur-xl animate-pulse`}>
                              <availabilityBadge.icon className="w-3 h-3 mr-1.5" />
                              {availabilityBadge.text}
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-4 left-4">
                          <span
                            className="px-4 py-2 text-xs font-black rounded-2xl shadow-lg backdrop-blur-xl"
                            style={{
                              backgroundColor: event.category?.color || '#FF6B35',
                              color: 'white',
                            }}
                          >
                            {event.category?.name_fr}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className={`text-xl font-black mb-4 line-clamp-2 transition-colors ${
                          isDark
                            ? 'text-amber-50 group-hover:text-amber-400'
                            : 'text-slate-900 group-hover:text-orange-600'
                        }`}>
                          {event.title}
                        </h3>

                        <div className="space-y-3 mb-5">
                          <div className="flex items-center text-sm">
                            <Calendar className={`w-4 h-4 mr-3 flex-shrink-0 ${
                              isDark ? 'text-amber-400' : 'text-orange-500'
                            }`} />
                            <span className={`font-semibold ${isDark ? 'text-amber-200/80' : 'text-slate-600'}`}>
                              {new Date(event.start_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className={`w-4 h-4 mr-3 flex-shrink-0 ${
                              isDark ? 'text-blue-400' : 'text-blue-500'
                            }`} />
                            <span className={`font-semibold ${isDark ? 'text-amber-200/80' : 'text-slate-600'}`}>
                              {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className={`w-4 h-4 mr-3 flex-shrink-0 ${
                              isDark ? 'text-red-400' : 'text-red-500'
                            }`} />
                            <span className={`font-semibold ${isDark ? 'text-amber-200/80' : 'text-slate-600'}`}>
                              {event.venue_name}, {event.venue_city}
                            </span>
                          </div>
                        </div>

                        {!event.is_free && minPrice > 0 && (
                          <div className={`pt-5 border-t ${isDark ? 'border-amber-900/30' : 'border-slate-200'}`}>
                            <div className="flex items-end justify-between">
                              <div>
                                <p className={`text-xs mb-1 font-semibold ${isDark ? 'text-amber-500/60' : 'text-slate-500'}`}>
                                  À partir de
                                </p>
                                <p className={`text-3xl font-black ${
                                  isDark
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent'
                                    : 'bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent'
                                }`}>
                                  {minPrice.toLocaleString()} F
                                </p>
                              </div>
                              <button className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg group-hover:scale-110 ${
                                isDark
                                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black shadow-amber-900/40'
                                  : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-orange-500/30'
                              }`}>
                                ACHETER
                              </button>
                            </div>
                          </div>
                        )}

                        {event.is_free && (
                          <div className={`pt-5 border-t ${isDark ? 'border-amber-900/30' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                              <span className="px-5 py-2.5 text-sm font-black bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg">
                                ENTRÉE GRATUITE
                              </span>
                              <button className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg group-hover:scale-110 ${
                                isDark
                                  ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border-2 border-amber-800/40'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-200'
                              }`}>
                                Inscription
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
                <div className="text-center py-32">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 ${
                    isDark ? 'bg-amber-950/40' : 'bg-slate-100'
                  }`}>
                    <Calendar className={`w-12 h-12 ${isDark ? 'text-amber-700/40' : 'text-slate-400'}`} />
                  </div>
                  <h3 className={`text-3xl font-black mb-3 ${isDark ? 'text-amber-200' : 'text-slate-800'}`}>
                    Aucun événement trouvé
                  </h3>
                  <p className={isDark ? 'text-amber-500/60' : 'text-slate-500'}>
                    Essayez de modifier vos critères de recherche
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className={`border-t mt-24 ${
        isDark ? 'bg-black/60 border-amber-900/20' : 'bg-slate-50 border-slate-200'
      } backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isDark
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-orange-500 to-pink-600'
                }`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-black ${
                    isDark
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent'
                  }`}>
                    EvenPass
                  </h1>
                  <p className={`text-xs font-medium ${isDark ? 'text-amber-500/60' : 'text-slate-500'}`}>
                    Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw
                  </p>
                </div>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-amber-200/60' : 'text-slate-600'}`}>
                La plateforme premium de billetterie événementielle au Sénégal.
                Découvrez, achetez et vivez des expériences uniques.
              </p>
            </div>

            <div>
              <h3 className={`font-black mb-4 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                Accès Rapide
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={() => navigate('/')}
                    className={`transition-colors ${
                      isDark ? 'text-amber-300/60 hover:text-amber-400' : 'text-slate-600 hover:text-orange-500'
                    }`}
                  >
                    Événements
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/organizer/dashboard')}
                    className={`transition-colors ${
                      isDark ? 'text-amber-300/60 hover:text-amber-400' : 'text-slate-600 hover:text-orange-500'
                    }`}
                  >
                    Organisateur
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/scan')}
                    className={`transition-colors ${
                      isDark ? 'text-amber-300/60 hover:text-amber-400' : 'text-slate-600 hover:text-orange-500'
                    }`}
                  >
                    Scanner
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className={`font-black mb-4 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                Support
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    className={`transition-colors ${
                      isDark ? 'text-amber-300/60 hover:text-amber-400' : 'text-slate-600 hover:text-orange-500'
                    }`}
                  >
                    Aide
                  </button>
                </li>
                <li>
                  <button
                    className={`transition-colors ${
                      isDark ? 'text-amber-300/60 hover:text-amber-400' : 'text-slate-600 hover:text-orange-500'
                    }`}
                  >
                    CGU
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className={`pt-8 border-t ${isDark ? 'border-amber-900/20' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center">
              <p className={`text-sm ${isDark ? 'text-amber-500/40' : 'text-slate-500'}`}>
                &copy; 2025 EvenPass. Tous droits réservés.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/admin/finance/login')}
                  className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-all hover:scale-125 shadow-lg hover:shadow-green-500/50"
                  aria-label="Admin Finance"
                />
                <button
                  onClick={() => navigate('/admin/ops/login')}
                  className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all hover:scale-125 shadow-lg hover:shadow-yellow-500/50"
                  aria-label="Ops Manager"
                />
                <button
                  onClick={() => navigate('/scan/login')}
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-all hover:scale-125 shadow-lg hover:shadow-red-500/50"
                  aria-label="EPscan"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
