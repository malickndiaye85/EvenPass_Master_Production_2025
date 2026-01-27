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
  Eye,
  Ticket
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import DynamicLogo from '../components/DynamicLogo';

export default function ForOrganizersPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard Temps Réel',
      description: 'Suivez vos ventes minute par minute avec des statistiques détaillées et des alertes instantanées.',
      color: '#FF6B00'
    },
    {
      icon: Ticket,
      title: 'Billets Sécurisés',
      description: 'QR codes uniques et cryptés avec protection totale contre la fraude et la contrefaçon.',
      color: '#10B981'
    },
    {
      icon: Wallet,
      title: 'Paiements Instantanés',
      description: 'Recevez vos fonds directement via Wave et Orange Money de manière sécurisée.',
      color: '#3B82F6'
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 group"
            >
              <DynamicLogo size="md" />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/organizer/login')}
                className="px-6 py-2.5 rounded-lg font-semibold text-sm text-[#1A1A1A] border border-gray-300 hover:border-[#FF6B00] hover:bg-gray-50 transition-all"
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate('/organizer/signup')}
                className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-[#FF6B00] text-white hover:bg-[#E55F00] transition-all shadow-sm"
              >
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* Background gradient - subtle orange to white */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF7ED] via-[#FFFBF7] to-white"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            {/* Badge */}
            <div className="inline-flex items-center px-5 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm mb-8">
              <span className="mr-2">🏆</span>
              <span className="text-sm font-semibold text-[#6B7280]">
                Solution Professionnelle
              </span>
            </div>

            {/* Hero Title - 3 lines with different colors */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 leading-[1.1]">
              <span className="block text-[#1A1A1A]">Créez</span>
              <span className="block text-[#FF6B00]">Vendez</span>
              <span className="block text-[#10B981]">Gérez</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl max-w-3xl mx-auto font-medium mb-12 text-[#6B7280]">
              La plateforme tout-en-un pour transformer vos événements en succès
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/organizer/signup')}
                className="group inline-flex items-center gap-3 px-12 py-6 rounded-xl font-bold text-lg bg-[#FF6B00] text-white hover:bg-[#E55F00] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                DEVENIR ORGANISATEUR
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Key Numbers - 4 cards horizontal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl p-6 bg-white border border-gray-200 text-center transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-[#FF6B00]" strokeWidth={2.5} />
                  <div className="text-4xl font-black mb-2 text-[#1A1A1A]">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-[#6B7280]">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Section: La Rupture DEM ÉVÉNEMENT */}
          <div className="rounded-3xl p-12 bg-white border border-gray-200 shadow-md mb-32">
            <h2 className="text-4xl font-black text-center mb-4 text-[#1A1A1A]">
              La Rupture DEM ÉVÉNEMENT
            </h2>
            <p className="text-center text-lg mb-16 max-w-3xl mx-auto text-[#6B7280]">
              Transformez votre gestion d'événements : du chaos manuel à l'excellence digitale
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Problems */}
              <div className="rounded-2xl p-8 bg-red-50 border border-red-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <X className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black text-red-700">
                    ❌ Gestion Traditionnelle
                  </h3>
                </div>
                <ul className="space-y-4">
                  {traditional.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                        <span className="text-red-700 font-semibold">
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Right: Solutions */}
              <div className="rounded-2xl p-8 bg-green-50 border border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black text-green-700">
                    ✅ Plateforme DEM ÉVÉNEMENT
                  </h3>
                </div>
                <ul className="space-y-4">
                  {digital.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
                        <span className="text-green-700 font-semibold">
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Features Grid - 3 cards */}
          <div className="mb-32">
            <h2 className="text-4xl font-black text-center mb-16 text-[#1A1A1A]">
              Fonctionnalités Essentielles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group rounded-2xl p-8 bg-white border border-gray-200 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
                  >
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: feature.color }}>
                      <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-black mb-3 text-[#1A1A1A]">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#6B7280]">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="rounded-3xl p-12 text-center bg-[#FF6B00] shadow-lg">
            <h2 className="text-4xl font-black mb-6 text-white">
              Prêt à Révolutionner vos Événements ?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-white/95">
              Rejoignez les organisateurs qui font confiance à DemDem pour gérer leurs événements au Sénégal
            </p>
            <button
              onClick={() => navigate('/organizer/signup')}
              className="group inline-flex items-center gap-3 px-12 py-6 rounded-xl font-bold text-lg bg-white text-[#FF6B00] hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              CRÉER MON COMPTE ORGANISATEUR
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
