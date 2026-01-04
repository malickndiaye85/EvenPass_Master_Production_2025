import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Anchor, Bus, ArrowRight, Calendar, MapPin, Ticket, Moon, Sun, Wallet } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';

interface ServiceCard {
  id: string;
  name: string;
  officialName: string;
  description: string;
  route: string;
  features: string[];
  icon: React.ReactNode;
  path: string;
  available: boolean;
  badge?: string;
}

const PassServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const services: ServiceCard[] = [
    {
      id: 'lmdg',
      name: 'LMDG',
      officialName: 'Liaison Maritime Dakar-Gorée',
      description: 'Service de chaloupe rapide entre Dakar et l\'île de Gorée',
      route: 'Dakar ⇄ Gorée',
      features: [
        'Départs toutes les heures',
        'Traversée 20 minutes',
        'Tarifs résidents',
        'Billets unitaires'
      ],
      icon: (
        <div className="relative">
          <Anchor className="w-12 h-12" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
            <Ship className="w-4 h-4 text-white" />
          </div>
        </div>
      ),
      path: '/pass/lmdg',
      available: true,
      badge: 'POPULAIRE'
    },
    {
      id: 'cosama',
      name: 'COSAMA',
      officialName: 'Compagnie Sénégalaise de Navigation Maritime',
      description: 'Navire pour traversée maritime longue distance',
      route: 'Dakar ⇄ Ziguinchor',
      features: [
        'Cabines & Pullman',
        'Traversée 15 heures',
        'Transport véhicules',
        'Petit-déjeuner inclus'
      ],
      icon: (
        <div className="relative">
          <Ship className="w-12 h-12" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0A7EA3] rounded-full flex items-center justify-center">
            <Anchor className="w-5 h-5 text-white" />
          </div>
        </div>
      ),
      path: '/pass/cosama',
      available: true
    },
    {
      id: 'interregional',
      name: 'CARS INTERRÉGIONAUX',
      officialName: 'Transport Terrestre Interrégional',
      description: 'Réseau de bus et cars longue distance',
      route: 'Toutes les régions du Sénégal',
      features: [
        'Réseau national',
        'Places numérotées',
        'Confort climatisé',
        'Horaires flexibles'
      ],
      icon: (
        <div className="relative">
          <Bus className="w-12 h-12" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
        </div>
      ),
      path: '/pass/interregional',
      available: true
    }
  ];

  const handleServiceClick = (service: ServiceCard) => {
    if (service.available) {
      navigate(service.path);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
                <Logo size="md" variant="default" />
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    EvenPass
                  </span>
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                    isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#E6F1F5] text-[#0A7EA3]'
                  }`}>
                    PASS
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pass/wallet')}
                className={`flex items-center gap-2 px-4 py-2 font-bold transition-all transform hover:scale-105 ${
                  isDark
                    ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] text-white shadow-lg'
                    : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] text-white shadow-lg'
                }`}
                style={{ borderRadius: '20px 8px 20px 8px' }}
              >
                <Wallet className="w-5 h-5" />
                Mon Wallet
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  isDark ? 'bg-gray-800 text-cyan-400' : 'bg-gray-100 text-gray-700'
                }`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => navigate('/even')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isDark
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Retour à EVEN
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-6">
              <div className={`p-3 rounded-2xl ${
                isDark ? 'bg-gradient-to-br from-cyan-500/20 to-[#0A7EA3]/20' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'
              }`}>
                <Ship className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
              </div>
            </div>

            <h1 className={`text-5xl font-black mb-4 ${
              isDark
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#0A7EA3]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-[#0A7EA3] to-[#005975]'
            }`}>
              Services de Mobilité
            </h1>

            <p className={`text-xl mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Choisissez votre mode de transport
            </p>

            <p className={`text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
              Gënaa Gaaw
            </p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8 mb-16">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className={`group relative ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } rounded-3xl p-8 transition-all duration-300 cursor-pointer border-2 ${
                  isDark ? 'border-gray-700 hover:border-cyan-500/50' : 'border-gray-200 hover:border-[#0A7EA3]/50'
                } hover:shadow-2xl hover:-translate-y-2 ${
                  !service.available ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {service.badge && (
                  <div className="absolute top-6 right-6">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                    }`}>
                      {service.badge}
                    </span>
                  </div>
                )}

                <div className={`inline-flex items-center justify-center p-4 rounded-2xl mb-6 ${
                  isDark
                    ? 'bg-gradient-to-br from-cyan-500/20 to-[#0A7EA3]/20'
                    : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6]'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <div className={isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}>
                    {service.icon}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className={`text-2xl font-black mb-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {service.name}
                  </h3>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                    isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'
                  }`}>
                    {service.officialName}
                  </p>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {service.description}
                  </p>
                </div>

                <div className={`flex items-center gap-2 mb-6 pb-6 border-b ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <MapPin className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {service.route}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                        isDark ? 'bg-cyan-400' : 'bg-[#0A7EA3]'
                      }`}></div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={!service.available}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 group-hover:gap-4 ${
                    service.available
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-500 to-[#0A7EA3] hover:from-cyan-600 hover:to-[#006B8C]'
                        : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {service.available ? 'Acheter' : 'Bientôt disponible'}
                  {service.available && (
                    <ArrowRight className="w-5 h-5 transition-all" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className={`rounded-3xl p-8 ${
            isDark ? 'bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/30' : 'bg-gradient-to-br from-[#E6F1F5] to-[#B3D9E6] border border-[#0A7EA3]/20'
          }`}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Ticket className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                  <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Pass Abonnements
                  </h3>
                </div>
                <p className={`text-lg mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Voyagez en illimité avec nos abonnements mensuels ou annuels
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Économisez jusqu'à 40% sur vos trajets réguliers
                </p>
              </div>
              <button
                onClick={() => navigate('/pass/subscriptions')}
                className={`px-8 py-4 font-bold text-white transition-all hover:scale-105 shadow-xl ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
                }`}
                style={{ borderRadius: '25px 10px 25px 10px' }}
              >
                Découvrir les Pass
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 grid-cols-1 gap-6">
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
              <Calendar className={`w-8 h-8 mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
              <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Réservation simple
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Réservez votre ticket en quelques secondes, sans inscription obligatoire
              </p>
            </div>

            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
              <Ticket className={`w-8 h-8 mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
              <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Tickets numériques
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                QR Code instantané par SMS et disponible dans votre Wallet
              </p>
            </div>

            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
              <MapPin className={`w-8 h-8 mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
              <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Couverture nationale
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Service disponible sur l'ensemble du territoire sénégalais
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className={`border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} py-8`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo size="sm" variant="default" />
              <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                © 2026 EvenPass. Tous droits réservés.
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/pass/wallet')}
                className={`text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-600 hover:text-[#0A7EA3]'
                }`}
              >
                Mon Wallet
              </button>
              <button
                onClick={() => navigate('/pass/help')}
                className={`text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-600 hover:text-[#0A7EA3]'
                }`}
              >
                Aide
              </button>
              <button
                onClick={() => navigate('/even')}
                className={`text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-amber-400' : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                Retour à EVEN
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PassServicesPage;
