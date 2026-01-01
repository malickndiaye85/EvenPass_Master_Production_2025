import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Wallet, Smartphone, Mail, Lock, Phone, Check, Users, TrendingUp, Shield } from 'lucide-react';

export default function ForOrganizersPage() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: BarChart3,
      title: 'Dashboard Complet',
      description: 'Suivez vos ventes en temps réel, gérez vos billets et analysez vos statistiques',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Wallet,
      title: 'Paiements Mobile Money',
      description: 'Recevez vos paiements rapidement via Wave et Orange Money',
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      icon: Smartphone,
      title: 'Billets QR Code',
      description: 'Génération automatique de QR Codes et validation à l\'entrée via notre scanner',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Mail,
      title: 'WhatsApp & Email Auto',
      description: 'Envoi automatique des billets par WhatsApp et email à vos clients',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: Lock,
      title: '100% Sécurisé',
      description: 'Plateforme sécurisée avec protection contre la fraude et les duplications',
      gradient: 'from-red-500 to-rose-600'
    },
    {
      icon: Phone,
      title: 'Support Dédié',
      description: 'Une équipe disponible pour vous accompagner dans l\'organisation de vos événements',
      gradient: 'from-indigo-500 to-blue-600'
    }
  ];

  const features = [
    'Création d\'événements illimitée',
    'Dashboard en temps réel',
    'Génération QR Codes automatique',
    'Scanner mobile inclus',
    'WhatsApp & Email automatiques',
    'Paiements Wave & Orange Money',
    'Support client prioritaire',
    'Protection anti-fraude',
    'Statistiques détaillées',
    'Limite de 3 billets par catégorie',
  ];

  const stats = [
    { value: '10K+', label: 'Billets vendus', icon: Users },
    { value: '500+', label: 'Événements', icon: BarChart3 },
    { value: '98%', label: 'Satisfaction', icon: TrendingUp },
    { value: '100%', label: 'Sécurisé', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="sticky top-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-xl border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#B5B5B5] hover:text-[#FF7A00] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Retour à l'accueil</span>
          </button>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#0F0F0F] to-[#1A1A1A] py-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
            <span className="bg-gradient-to-r from-[#FF5F05] via-[#FF8C42] to-[#FFA05D] bg-clip-text text-transparent">
              Pour les Organisateurs
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[#B5B5B5] mb-12 max-w-3xl mx-auto">
            Gérez vos événements facilement avec EvenPass et maximisez vos ventes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/organizer/signup')}
              className="px-8 py-4 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-[#FF5F05]/30"
            >
              Devenir organisateur
            </button>
            <button
              onClick={() => navigate('/organizer/login')}
              className="px-8 py-4 bg-[#1A1A1A] border-2 border-[#2A2A2A] text-white rounded-2xl font-bold text-lg hover:border-[#FF5F05] transition-all"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] text-center hover:border-[#FF5F05] transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#FF5F05] to-[#FF8C42] rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-4xl font-black text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-[#B5B5B5]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-4xl font-black text-white text-center mb-4">
            Pourquoi choisir EvenPass ?
          </h2>
          <p className="text-center text-[#B5B5B5] text-lg mb-12 max-w-2xl mx-auto">
            Tous les outils dont vous avez besoin pour réussir vos événements
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-[#1A1A1A] rounded-3xl p-8 border border-[#2A2A2A] hover:border-[#FF5F05] transition-all group"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <benefit.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-[#B5B5B5] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-12 border-2 border-[#FF5F05] mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5F05]/10 rounded-full text-[#FF5F05] font-bold text-sm mb-4">
                Tarification Simple
              </div>
              <h2 className="text-5xl font-black text-white mb-4">
                5% de commission
              </h2>
              <p className="text-[#B5B5B5] text-lg">
                Par billet vendu - Aucun frais caché
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-[#0F0F0F] rounded-xl border border-[#2A2A2A]"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/organizer/signup')}
                className="px-12 py-5 bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] text-white rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-[#FF5F05]/30"
              >
                Commencer maintenant
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-black text-white mb-6">
            Prêt à commencer ?
          </h2>
          <div className="space-y-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 text-white text-lg">
              <Phone className="w-6 h-6" />
              <a href="tel:+221771392926" className="font-bold hover:underline">
                +221 77 139 29 26
              </a>
            </div>
            <div className="flex items-center justify-center gap-3 text-white text-lg">
              <Mail className="w-6 h-6" />
              <a href="mailto:contact@evenpass.sn" className="font-bold hover:underline">
                contact@evenpass.sn
              </a>
            </div>
          </div>
          <p className="text-white/90 text-lg">
            Notre équipe vous accompagne dans la mise en place de votre premier événement
          </p>
        </div>
      </div>
    </div>
  );
}
