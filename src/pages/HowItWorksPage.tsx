import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Search,
  CreditCard,
  Smartphone,
  QrCode,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  X,
  Sun,
  Moon,
  Users,
  TrendingUp,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';

export default function HowItWorksPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const steps = [
    {
      number: '01',
      icon: Search,
      title: 'Découvrez',
      subtitle: 'Trouvez votre événement',
      description: 'Parcourez notre catalogue d\'événements premium au Sénégal. Concerts, lutte, théâtre, sport et bien plus.',
      color: 'from-blue-500 to-cyan-500',
      delay: '0s'
    },
    {
      number: '02',
      icon: CreditCard,
      title: 'Achetez',
      subtitle: 'Paiement 100% sécurisé',
      description: 'Payez en toute sécurité avec Orange Money ou Wave. Transaction cryptée et instantanée.',
      color: 'from-green-500 to-emerald-500',
      delay: '0.1s'
    },
    {
      number: '03',
      icon: Smartphone,
      title: 'Recevez',
      subtitle: 'Billet digital instantané',
      description: 'Votre billet digital arrive immédiatement par SMS et email avec QR code unique et sécurisé.',
      color: 'from-purple-500 to-pink-500',
      delay: '0.2s'
    },
    {
      number: '04',
      icon: QrCode,
      title: 'Entrez',
      subtitle: 'Scan rapide à l\'entrée',
      description: 'Présentez votre QR code. Scan ultra-rapide (< 200ms) et validation instantanée. Aucune file d\'attente.',
      color: 'from-orange-500 to-red-500',
      delay: '0.3s'
    }
  ];

  const advantages = [
    {
      icon: Shield,
      title: 'Sécurité Totale',
      description: 'Protection anti-fraude avec QR codes uniques et cryptés',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Zap,
      title: 'Ultra Rapide',
      description: 'Validation en moins de 200ms, zéro file d\'attente',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      icon: Clock,
      title: '24/7 Disponible',
      description: 'Achetez vos billets à tout moment, où que vous soyez',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Smartphone,
      title: '100% Digital',
      description: 'Zéro papier, tout sur votre téléphone',
      gradient: 'from-purple-500 to-pink-600'
    }
  ];

  const traditional = [
    { icon: Clock, text: 'Files d\'attente interminables', color: 'text-red-500' },
    { icon: AlertTriangle, text: 'Risque de billets contrefaits', color: 'text-red-500' },
    { icon: X, text: 'Perte ou oubli du billet papier', color: 'text-red-500' },
    { icon: Users, text: 'Gestion manuelle et erreurs', color: 'text-red-500' }
  ];

  const digital = [
    { icon: Zap, text: 'Entrée instantanée (< 200ms)', color: 'text-green-500' },
    { icon: Shield, text: 'Sécurité maximale anti-fraude', color: 'text-green-500' },
    { icon: Smartphone, text: 'Billet toujours sur vous', color: 'text-green-500' },
    { icon: CheckCircle, text: 'Traçabilité complète en temps réel', color: 'text-green-500' }
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
              <Zap className={`w-4 h-4 mr-2 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
              <span className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-slate-700'}`}>
                Simple, Rapide, Sécurisé
              </span>
            </div>

            <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black mb-8 leading-[1.1] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Comment ça
              <span className={`block ${
                isDark ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent'
              }`}>
                marche ?
              </span>
            </h1>

            <p className={`text-xl sm:text-2xl max-w-3xl mx-auto font-medium ${
              isDark ? 'text-amber-100/80' : 'text-slate-600'
            }`}>
              4 étapes pour vivre une expérience événementielle révolutionnaire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className={`group relative rounded-[32px] p-8 border-2 transition-all duration-500 hover:-translate-y-2 ${
                    isDark ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40 hover:border-amber-600' : 'bg-white/80 backdrop-blur-xl border-slate-200 hover:border-orange-300 shadow-lg hover:shadow-2xl'
                  }`}
                  style={{ animationDelay: step.delay }}
                >
                  <div className="flex items-start gap-6 mb-6">
                    <div className={`relative flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                      <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-sm font-black shadow-lg`}>
                        {step.number}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm font-bold mb-3 ${isDark ? 'text-amber-400' : 'text-orange-500'}`}>
                        {step.subtitle}
                      </p>
                      <p className={`text-base leading-relaxed ${isDark ? 'text-amber-200/70' : 'text-slate-600'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <ArrowRight className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-orange-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`rounded-[48px] p-12 border-2 mb-32 ${
            isDark ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40' : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-2xl'
          }`}>
            <h2 className={`text-4xl font-black text-center mb-16 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
              La Différence EvenPass
            </h2>

            <div className="grid md:grid-cols-2 gap-12">
              <div className={`rounded-3xl p-8 border-2 ${
                isDark ? 'bg-red-950/20 border-red-800/40' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <X className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <h3 className={`text-2xl font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    Billetterie Traditionnelle
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
                    Solution EvenPass
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <div
                  key={index}
                  className={`group rounded-3xl p-6 border-2 transition-all duration-300 hover:-translate-y-2 ${
                    isDark ? 'bg-gradient-to-br from-amber-950/40 to-orange-950/40 backdrop-blur-xl border-amber-800/40 hover:border-amber-600' : 'bg-white border-slate-200 hover:border-orange-300 shadow-lg hover:shadow-2xl'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${advantage.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                    {advantage.title}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-amber-200/60' : 'text-slate-600'}`}>
                    {advantage.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className={`group inline-flex items-center gap-3 px-12 py-6 rounded-3xl font-black text-lg transition-all duration-300 shadow-2xl hover:scale-105 ${
                isDark ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black' : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
              }`}
            >
              Découvrir les événements
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
