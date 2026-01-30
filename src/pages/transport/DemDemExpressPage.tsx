import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Clock, AlertCircle, CreditCard } from 'lucide-react';
import DynamicLogo from '../../components/DynamicLogo';

interface BusRoute {
  id: string;
  routeNumber: string;
  name: string;
  distance: number;
  duration: number;
  schedule: {
    eco: {
      firstDeparture: string;
      lastDeparture: string;
      frequency: string;
    };
    comfort: {
      firstDeparture: string;
      lastDeparture: string;
      frequency: string;
    };
  };
  pricing: {
    eco: number;
    comfort: number;
  };
}

const routes: BusRoute[] = [
  {
    id: '1',
    routeNumber: '1',
    name: 'Keur Massar ⇄ Dakar Centre',
    distance: 25,
    duration: 45,
    schedule: {
      eco: {
        firstDeparture: '05h00',
        lastDeparture: '23h00',
        frequency: '20 min'
      },
      comfort: {
        firstDeparture: '05h30',
        lastDeparture: '22h00',
        frequency: '30 min'
      }
    },
    pricing: {
      eco: 500,
      comfort: 800
    }
  },
  {
    id: '2',
    routeNumber: '2',
    name: 'Pikine ⇄ Plateau',
    distance: 18,
    duration: 35,
    schedule: {
      eco: {
        firstDeparture: '05h00',
        lastDeparture: '23h00',
        frequency: '15 min'
      },
      comfort: {
        firstDeparture: '06h00',
        lastDeparture: '21h00',
        frequency: '25 min'
      }
    },
    pricing: {
      eco: 400,
      comfort: 650
    }
  },
  {
    id: '3',
    routeNumber: '3',
    name: 'Rufisque ⇄ Dakar',
    distance: 30,
    duration: 50,
    schedule: {
      eco: {
        firstDeparture: '05h30',
        lastDeparture: '22h30',
        frequency: '25 min'
      },
      comfort: {
        firstDeparture: '06h00',
        lastDeparture: '21h30',
        frequency: '35 min'
      }
    },
    pricing: {
      eco: 600,
      comfort: 900
    }
  }
];

export default function DemDemExpressPage() {
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);

  const isComfortAvailable = () => {
    const now = new Date();
    const hour = now.getHours();
    return (hour >= 5 && hour < 10) || (hour >= 16 && hour < 22);
  };

  const comfortAvailable = isComfortAvailable();

  const handleRouteSelect = (route: BusRoute) => {
    setSelectedRoute(route);
  };

  const handleBooking = (tier: 'eco' | 'comfort') => {
    if (tier === 'comfort' && !comfortAvailable) {
      alert('Le service Comfort n\'est pas disponible actuellement (10h-16h).');
      return;
    }
    alert(`Réservation ${tier === 'eco' ? 'Eco' : 'Comfort'}\nLigne: ${selectedRoute?.name}\nPrix: ${selectedRoute?.pricing[tier]} FCFA`);
  };

  if (selectedRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
        <nav className="bg-blue-950/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <DynamicLogo />
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedRoute(null)}
              className="text-white/70 hover:text-white mb-6 font-semibold transition-colors"
            >
              ← Changer de ligne
            </button>

            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                <span className="bg-amber-400 text-blue-950 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                  {selectedRoute.routeNumber}
                </span>
                {selectedRoute.name}
              </h1>
              <p className="text-white/70 text-lg">
                Sélectionnez votre niveau de confort
              </p>
            </div>

            {!comfortAvailable && (
              <div className="bg-orange-500/20 border-l-4 border-orange-400 p-6 mb-6 rounded-r-2xl backdrop-blur-sm">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-white mb-1">Service Comfort en pause</h3>
                    <p className="text-white/80 text-sm">
                      Le service Comfort est disponible de 05h à 10h et de 16h à 22h. Le service Eco reste disponible toute la journée.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleBooking('eco')}
                className="p-6 rounded-3xl border-3 bg-white/5 border-white/20 hover:border-[#10B981]/50 hover:bg-white/10 transition-all"
              >
                <div className="text-center">
                  <p className="text-xl text-white font-bold mb-3">Eco</p>
                  <p className="text-4xl text-white font-black mb-2">
                    {selectedRoute.pricing.eco.toLocaleString()}
                  </p>
                  <p className="text-sm text-white/60 mb-3">FCFA / place</p>
                  <p className="text-xs text-[#10B981] font-semibold">
                    ✓ Disponible 24h/24
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleBooking('comfort')}
                disabled={!comfortAvailable}
                className={`p-6 rounded-3xl border-3 relative ${
                  comfortAvailable
                    ? 'bg-white/5 border-white/20 hover:border-amber-400/50 hover:bg-white/10'
                    : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                } transition-all`}
              >
                {!comfortAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-400 rotate-[-15deg] text-center">
                      NON DISPONIBLE<br/>10h - 16h
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xl text-white font-bold mb-3">Comfort</p>
                  <p className="text-4xl text-white font-black mb-2">
                    {selectedRoute.pricing.comfort.toLocaleString()}
                  </p>
                  <p className="text-sm text-white/60 mb-3">FCFA / place</p>
                  <p className="text-xs text-amber-400 font-semibold">
                    05h-10h & 16h-22h
                  </p>
                </div>
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-6 border-2 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Informations de la ligne</h3>
              <div className="space-y-3 text-white/80">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <span>{selectedRoute.distance} km • {selectedRoute.duration} minutes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Premier départ Eco: {selectedRoute.schedule.eco.firstDeparture}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-amber-400" />
                  <span>Fréquence Eco: toutes les {selectedRoute.schedule.eco.frequency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
      <nav className="bg-blue-950/95 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <DynamicLogo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              DEM-DEM EXPRESS
            </h1>
            <p className="text-white/70 text-lg">
              Bus navettes confortables avec abonnements illimités
            </p>
          </div>

          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">
              Choisissez votre ligne
            </h2>

            {routes.map((route) => (
              <div
                key={route.id}
                onClick={() => handleRouteSelect(route)}
                className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-8 cursor-pointer hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] border-2 border-white/10 hover:border-amber-400/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-amber-400 text-blue-950 rounded-full w-12 h-12 flex items-center justify-center font-bold shadow-lg shadow-amber-400/50">
                        {route.routeNumber}
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        {route.name}
                      </h3>
                    </div>

                    <div className="space-y-2 text-white/70 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-amber-400" />
                        <span>{route.distance} km • {route.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span>Premier départ: {route.schedule.eco.firstDeparture}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center space-x-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                        <span className="text-xs text-white/60">Eco</span>
                        <p className="text-xl font-bold text-white">
                          {route.pricing.eco.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                        <span className="text-xs text-white/60">Comfort</span>
                        <p className="text-xl font-bold text-white">
                          {route.pricing.comfort.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                  </div>

                  <Bus className="w-16 h-16 text-amber-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-blue-500/20 border-l-4 border-blue-400 p-6 rounded-r-2xl backdrop-blur-sm">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-1">Abonnements SAMA PASS</h3>
                <p className="text-white/80 text-sm">
                  Économisez jusqu'à 40% avec les abonnements mensuels SAMA PASS pour trajets illimités.
                </p>
                <button
                  onClick={() => navigate('/pass/subscriptions')}
                  className="mt-3 text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-2 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Voir les offres SAMA PASS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
