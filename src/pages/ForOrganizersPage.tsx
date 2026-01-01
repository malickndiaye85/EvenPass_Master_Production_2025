import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  Wallet,
  Smartphone,
  Mail,
  Lock,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  X,
  Sun,
  Moon,
  AlertTriangle,
  Target,
  DollarSign,
  Activity,
  Eye
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';

export default function ForOrganizersPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: BarChart3,
      title: 'Tableau de Bord en Temps Réel',
      description: 'Suivez vos ventes minute par minute. Statistiques détaillées, graphiques interactifs et alertes instantanées.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Zap,
      title: 'Validation Ultra-Rapide',
      description: 'Scan des billets en moins de 200ms. Fluidité maximale à l\'entrée, zéro file d\'attente.',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      icon: Shield,
      title: 'Sécurité Anti-Fraude',
      description: 'Protection totale contre la contrefaçon. QR codes uniques et cryptés, traçabilité complète.',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: DollarSign,
      title: 'Paiements Instantanés',
      description: 'Recevez vos fonds directement via Wave et Orange Money. Transaction sécurisée et transparente.',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: Target,
      title: 'Arbitrage en Direct',
      description: 'Résolvez les litiges sur place avec accès aux données RGPD. Gestion intelligente des conflits.',
      gradient: 'from-red-500 to-rose-600'
    },
    {
      icon: Activity,
      title: 'Productivité Maximale',
      description: 'Automatisation complète : génération des billets, envoi SMS/Email, contrôle d\'accès.',
      gradient: 'from-indigo-500 to-blue-600'
    }
  ];

  const traditional = [
    { icon: Clock, text: 'Gestion manuelle chronophage', color: 'text-red-500' },
    { icon: AlertTriangle, text: 'Fraude et billets contrefaits', color: 'text-red-500' },
    { icon: X, text: 'Comptage manuel et erreurs', color: 'text-red-500' },
    { icon: Users, text: 'Files d\'attente interminables', color: 'text-red-500' },
    { icon: Eye, text: 'Visibilité financière limitée', color: 'text-red-500' }
  ];

  const digital = [
    { icon: Zap, text: 'Automatisation complète (< 1min)', color: 'text-green-500' },
    { icon: Shield, text: 'Sécurité maximale garantie', color: 'text-green-500' },
    { icon: BarChart3, text: 'Dashboard temps réel précis', color: 'text-green-500' },
    { icon: CheckCircle, text: 'Fluidité et rapidité optimales', color: 'text-green-500' },
    { icon: TrendingUp, text: 'Transparence financière totale', color: 'text-green-500' }
  ];

  const stats = [
    { value: '< 200ms', label: 'Temps de scan', icon: Zap },
    { value: '100%', label: 'Anti-fraude', icon: Shield },
    { value: '24/7', label: 'Support actif', icon: Activity },
    { value: '+10K', label: 'Billets vendus', icon: TrendingUp }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? 'bg-[#050505]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isDark ? 'bg-black/60 border-amber-900/20' : 'bg-white/60 border-slate-200/60'
      } backdrop-blur-2xl border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 group"
            >
              <div className="relative">
                <div className={`absolute -inset-0.5 rounded-2xl blur opacity-70 group-hover:opacity-100 transition ${
                  isDark ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-orange-400 to-pink-500'
                }`}></div>
                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700' : 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500'
                }`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tight ${
                  isDark ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent'
                }`}>
                  EvenPass
                </h1>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  isDark ? 'bg-amber-900/30 hover:bg-amber-800/40 text-amber-400 border border-amber-800/40' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className={`absolute inset-0 ${
          isDark ? 'bg-gradient-to-br from-amber-950/20 via-transparent to-orange-950/20' : 'bg-gradient-to-br from-orange-50 via-transparent to-pink-50'
        }`}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className={`inline-flex items-center px-5 py-2.5 rounded-full border mb-8 ${
              isDark ? 'bg-amber-950/40 backdrop-blur-xl border-amber-800/40' : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg'
            }`}>
              <Target className={`w-4 h-4 mr-2 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
              <span className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-slate-700'}`}>
                Solution Professionnelle
              </span>
            </div>

            <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black mb-8 leading-[1.1] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span className="block">Créez</span>
              <span className={`block ${
                isDark ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent'
              }`}>
                Vendez
              </span>
              <span className="block">Gérez</span>
            </h1>

            <p className={`text-xl sm:text-2xl max-w-3xl mx-auto font-medium mb-12 ${
              isDark ? 'text-amber-100/80' : 'text-slate-600'
            }`}>
              La plateforme tout-en-un pour transformer vos événements en succès
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/organizer/signup')}
                className={`group inline-flex items-center gap-3 px-12 py-6 rounded-3xl font-black text-lg transition-all duration-300 shadow-2xl hover:scale-105 ${
                  isDark ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black' : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                }`}
              >
                Devenir Organisateur
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`rounded-3xl p-6 border-2 text-center transition-all duration-300 hover:-translate-y-2 ${
                    isDark ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40 hover:border-amber-600' : 'bg-white border-slate-200 hover:border-orange-300 shadow-lg hover:shadow-2xl'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} strokeWidth={2.5} />
                  <div className={`text-4xl font-black mb-2 ${
                    isDark ? 'bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent'
                  }`}>
                    {stat.value}
                  </div>
                  <div className={`text-sm font-bold ${isDark ? 'text-amber-200/60' : 'text-slate-600'}`}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`rounded-[48px] p-12 border-2 mb-32 ${
            isDark ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40' : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-2xl'
          }`}>
            <h2 className={`text-4xl font-black text-center mb-4 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
              La Rupture EvenPass
            </h2>
            <p className={`text-center text-lg mb-16 max-w-3xl mx-auto ${isDark ? 'text-amber-200/70' : 'text-slate-600'}`}>
              Transformez votre gestion d'événements : du chaos manuel à l'excellence digitale
            </p>

            <div className="grid md:grid-cols-2 gap-12">
              <div className={`rounded-3xl p-8 border-2 ${
                isDark ? 'bg-red-950/20 border-red-800/40' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <X className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <h3 className={`text-2xl font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    Gestion Traditionnelle
                  </h3>
                </div>
                <ul className="space-y-4">
                  {traditional.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${item.color}`} />
                        <span className={`${isDark ? 'text-red-300' : 'text-red-700'} font-semibold`}>
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className={`rounded-3xl p-8 border-2 ${
                isDark ? 'bg-green-950/20 border-green-800/40' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <h3 className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    Plateforme EvenPass
                  </h3>
                </div>
                <ul className="space-y-4">
                  {digital.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${item.color}`} />
                        <span className={`${isDark ? 'text-green-300' : 'text-green-700'} font-semibold`}>
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-32">
            <h2 className={`text-4xl font-black text-center mb-16 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
              Fonctionnalités Puissantes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`group rounded-3xl p-8 border-2 transition-all duration-300 hover:-translate-y-2 ${
                      isDark ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40 hover:border-amber-600' : 'bg-white border-slate-200 hover:border-orange-300 shadow-lg hover:shadow-2xl'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className={`text-xl font-black mb-3 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-amber-200/70' : 'text-slate-600'}`}>
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-[48px] p-12 text-center border-2 ${
            isDark ? 'bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-600/40' : 'bg-gradient-to-br from-orange-500 to-pink-500 border-transparent shadow-2xl'
          }`}>
            <h2 className={`text-4xl font-black mb-6 ${isDark ? 'text-amber-50' : 'text-white'}`}>
              Prêt à Révolutionner vos Événements ?
            </h2>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${isDark ? 'text-amber-100/80' : 'text-white/95'}`}>
              Rejoignez les organisateurs qui font confiance à EvenPass pour gérer leurs événements au Sénégal
            </p>
            <button
              onClick={() => navigate('/organizer/signup')}
              className={`group inline-flex items-center gap-3 px-12 py-6 rounded-3xl font-black text-lg transition-all duration-300 shadow-2xl hover:scale-105 ${
                isDark ? 'bg-white text-orange-600 hover:bg-gray-50' : 'bg-white text-orange-600 hover:bg-gray-50'
              }`}
            >
              Commencer Gratuitement
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
