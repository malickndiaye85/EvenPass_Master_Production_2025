import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Search, Clock, Users, AlertCircle } from 'lucide-react';
import DynamicLogo from '../../components/DynamicLogo';

type DayFilter = 'today' | 'tomorrow' | 'day2';

export default function AlloDakarPage() {
  const navigate = useNavigate();

  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayFilter>('today');
  const [searchSeats, setSearchSeats] = useState('1');

  const getDateForFilter = (filter: DayFilter): Date => {
    const date = new Date();
    if (filter === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    } else if (filter === 'day2') {
      date.setDate(date.getDate() + 2);
    }
    return date;
  };

  const formatDayLabel = (filter: DayFilter): string => {
    const date = getDateForFilter(filter);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };

    if (filter === 'today') return 'Aujourd\'hui';
    if (filter === 'tomorrow') return 'Demain';
    return date.toLocaleDateString('fr-FR', options);
  };

  const availableTripsCount = 0;

  const handleSearch = () => {
    if (!searchOrigin.trim() || !searchDestination.trim()) {
      alert('Veuillez renseigner le départ et l\'arrivée');
      return;
    }
    const dayLabel = formatDayLabel(selectedDay);
    alert(`Recherche en cours...\nDépart: ${searchOrigin}\nArrivée: ${searchDestination}\nDate: ${dayLabel}\nPlaces: ${searchSeats}`);
  };

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
              ALLO DAKAR
            </h1>
            <p className="text-white/70 text-lg">
              Covoiturage entre villes avec remboursement automatique
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl shadow-2xl p-6 md:p-8 mb-8 border-2 border-white/10">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
              Rechercher un trajet
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Départ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#10B981] w-5 h-5" />
                  <input
                    type="text"
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    placeholder="Ex: Dakar, Thiès, Mbour..."
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Arrivée
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="Ex: Dakar, Thiès, Mbour..."
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Quand partez-vous ?
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['today', 'tomorrow', 'day2'] as DayFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedDay(filter)}
                      className={`py-3 px-2 rounded-xl font-bold text-sm transition-all ${
                        selectedDay === filter
                          ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/50'
                          : 'bg-white/10 text-white/70 border-2 border-white/20 hover:border-[#10B981]/50'
                      }`}
                    >
                      {formatDayLabel(filter)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Nombre de places
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4'].map((seats) => (
                    <button
                      key={seats}
                      onClick={() => setSearchSeats(seats)}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        searchSeats === seats
                          ? 'bg-[#10B981] text-white shadow-lg'
                          : 'bg-white/10 text-white/70 border-2 border-white/20 hover:border-[#10B981]/50'
                      }`}
                    >
                      {seats}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Search className="w-5 h-5" />
                Rechercher des trajets
              </button>
            </div>
          </div>

          <div className="bg-[#10B981]/20 border-l-4 border-[#10B981] p-6 rounded-r-2xl backdrop-blur-sm">
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-[#10B981] mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-1">
                  {availableTripsCount} trajet{availableTripsCount > 1 ? 's' : ''} disponible{availableTripsCount > 1 ? 's' : ''} pour les prochaines 72h
                </h3>
                <p className="text-white/80 text-sm">
                  Les trajets sont triés par heure de départ (le plus proche en premier). Réservez rapidement pour obtenir les meilleures places.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-500/20 border-l-4 border-blue-400 p-6 rounded-r-2xl backdrop-blur-sm">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-1">Service en cours de déploiement</h3>
                <p className="text-white/80 text-sm">
                  Les trajets publiés par les chauffeurs s'afficheront ici. Vous pouvez aussi vous inscrire comme chauffeur pour proposer des trajets et rentabiliser vos trajets quotidiens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
