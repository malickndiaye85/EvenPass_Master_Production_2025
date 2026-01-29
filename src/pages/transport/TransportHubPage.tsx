import { useNavigate } from 'react-router-dom';
import { Bus, Car, Ship, ArrowRight, Home } from 'lucide-react';
import DynamicLogo from '../../components/DynamicLogo';

export default function TransportHubPage() {
  const navigate = useNavigate();

  const services = [
    {
      id: 'demdem-express',
      title: 'DemDem Express',
      description: 'Bus navettes confortables avec abonnements',
      icon: Bus,
      color: 'from-green-500 to-emerald-600',
      path: '/transport/demdem-express',
      features: ['Lignes fixes', 'Eco & Comfort', 'Abonnements'],
    },
    {
      id: 'allo-dakar',
      title: 'Allo Dakar',
      description: 'Covoiturage entre villes avec remboursement',
      icon: Car,
      color: 'from-blue-500 to-cyan-600',
      path: '/transport/allo-dakar',
      features: ['Covoiturage', 'Wallet', 'Remboursement auto'],
    },
    {
      id: 'pass-maritime',
      title: 'Pass Maritime',
      description: 'Liaisons maritimes LMDG, COSAMA, Interrégionales',
      icon: Ship,
      color: 'from-teal-500 to-blue-600',
      path: '/pass/services',
      features: ['Dakar-Gorée', 'Abonnements', 'Réservation'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A192F] via-[#0A192F] to-[#10B981]/20">
      <nav className="bg-[#0A192F]/50 backdrop-blur-xl border-b border-[#10B981]/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <DynamicLogo size="md" mode="transport" />
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-white hover:text-[#10B981] transition-all group"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold">Accueil</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              Dem Voyage
            </h1>
            <p className="text-xl text-gray-300">
              Choisissez votre mode de transport
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  onClick={() => navigate(service.path)}
                  className="group relative bg-white rounded-2xl shadow-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-[#10B981]/30"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

                  <div className="p-8">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${service.color} mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-2xl font-black text-[#0A192F] mb-3">
                      {service.title}
                    </h2>

                    <p className="text-gray-600 mb-6">
                      {service.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center space-x-2 text-[#10B981] font-bold group-hover:translate-x-2 transition-transform">
                      <span>Découvrir</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-xl rounded-2xl px-8 py-6 border border-[#10B981]/20">
              <p className="text-white text-sm mb-2">
                Besoin d'aide pour choisir ?
              </p>
              <button
                onClick={() => navigate('/help')}
                className="text-[#10B981] hover:underline font-semibold"
              >
                Contactez le support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
