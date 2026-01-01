import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Ticket, CreditCard, Smartphone, Zap, Lock, Mail, Wallet, CheckCircle, Calendar } from 'lucide-react';

export default function HowItWorksPage() {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      icon: Search,
      title: 'Découvrez les événements',
      description: 'Parcourez notre catalogue d\'événements : concerts, matchs, lutte, festivals et plus encore. Utilisez nos filtres pour trouver l\'événement parfait pour vous.',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      number: 2,
      icon: Ticket,
      title: 'Choisissez vos billets',
      description: 'Sélectionnez la catégorie de billets qui vous convient (VIP, Loge, Tribune...) et indiquez le nombre de places désirées. Maximum 3 billets par catégorie par transaction.',
      color: 'from-purple-500 to-pink-600'
    },
    {
      number: 3,
      icon: CreditCard,
      title: 'Payez en toute sécurité',
      description: 'Remplissez vos informations et payez avec Wave ou Orange Money. Toutes les transactions sont 100% sécurisées et cryptées.',
      color: 'from-orange-500 to-red-600'
    },
    {
      number: 4,
      icon: Smartphone,
      title: 'Recevez votre QR Code',
      description: 'Recevez instantanément votre billet par WhatsApp ou email avec un QR Code unique. Présentez-le à l\'entrée le jour J pour accéder à l\'événement !',
      color: 'from-green-500 to-emerald-600'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Rapide et Simple',
      description: 'Achetez vos billets en moins de 2 minutes, sans inscription obligatoire',
      color: 'text-yellow-400'
    },
    {
      icon: Lock,
      title: '100% Sécurisé',
      description: 'Paiements cryptés et protégés. Vos données personnelles sont en sécurité',
      color: 'text-green-400'
    },
    {
      icon: Smartphone,
      title: 'Billet Numérique',
      description: 'Plus besoin d\'imprimer ! Votre billet QR Code est toujours dans votre téléphone',
      color: 'text-blue-400'
    },
    {
      icon: Wallet,
      title: 'Paiement Mobile',
      description: 'Payez facilement avec Wave ou Orange Money, les moyens les plus utilisés',
      color: 'text-orange-400'
    },
    {
      icon: Mail,
      title: 'Confirmation Instantanée',
      description: 'Recevez votre billet par WhatsApp ou email immédiatement après l\'achat',
      color: 'text-purple-400'
    },
    {
      icon: Calendar,
      title: 'Tous les Événements',
      description: 'Concerts, sport, lutte, festivals... Trouvez tous vos événements préférés',
      color: 'text-pink-400'
    }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 bg-gradient-to-r from-[#FF5F05] via-[#FF8C42] to-[#FFA05D] bg-clip-text text-transparent">
            Comment ça marche ?
          </h1>
          <p className="text-xl text-[#B5B5B5] max-w-3xl mx-auto">
            Achetez vos billets en ligne en 4 étapes simples et sécurisées
          </p>
        </div>

        <div className="space-y-24 mb-24">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col lg:flex-row gap-12 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <div className={`relative w-40 h-40 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-2xl shadow-[#FF5F05]/30`}>
                  <div className="text-7xl font-black text-white">
                    {step.number}
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[#1A1A1A] rounded-3xl p-8 md:p-12 border border-[#2A2A2A] hover:border-[#FF5F05] transition-all">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl mb-6 shadow-lg`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">
                  {step.title}
                </h2>
                <p className="text-lg text-[#B5B5B5] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-12 border border-[#2A2A2A] mb-16">
          <h2 className="text-4xl font-black text-white text-center mb-4">
            Pourquoi choisir EvenPass ?
          </h2>
          <p className="text-center text-[#B5B5B5] text-lg mb-12 max-w-2xl mx-auto">
            La plateforme de billetterie la plus simple et sécurisée du Sénégal
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#0F0F0F] rounded-2xl p-8 border border-[#2A2A2A] hover:border-[#FF5F05] transition-all group"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-[#1A1A1A] rounded-xl mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#B5B5B5] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#FF5F05] to-[#FF8C42] rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Prêt à découvrir les événements ?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de Sénégalais qui utilisent EvenPass pour leurs événements
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#FF5F05] rounded-2xl font-black text-lg hover:bg-[#F5F5F5] transition-all shadow-xl hover:scale-105"
          >
            <CheckCircle className="w-6 h-6" />
            Voir les événements
          </button>
        </div>
      </div>
    </div>
  );
}
