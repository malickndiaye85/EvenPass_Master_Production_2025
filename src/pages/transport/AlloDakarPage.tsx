import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Search, Calendar, Users, AlertCircle } from 'lucide-react';
import DynamicLogo from '../../components/DynamicLogo';

export default function AlloDakarPage() {
  const navigate = useNavigate();

  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchSeats, setSearchSeats] = useState('1');

  const handleSearch = () => {
    if (!searchOrigin.trim() || !searchDestination.trim()) {
      alert('Veuillez renseigner le départ et l\'arrivée');
      return;
    }
    alert(`Recherche en cours...\nDépart: ${searchOrigin}\nArrivée: ${searchDestination}\nDate: ${searchDate || 'Aujourd\'hui'}\nPlaces: ${searchSeats}`);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Date de départ
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#10B981] w-5 h-5" />
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Nombre de places
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#10B981] w-5 h-5" />
                    <select
                      value={searchSeats}
                      onChange={(e) => setSearchSeats(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981] transition-all appearance-none"
                    >
                      <option value="1" className="bg-blue-950">1 place</option>
                      <option value="2" className="bg-blue-950">2 places</option>
                      <option value="3" className="bg-blue-950">3 places</option>
                      <option value="4" className="bg-blue-950">4 places</option>
                    </select>
                  </div>
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

          <div className="bg-blue-500/20 border-l-4 border-blue-400 p-6 rounded-r-2xl backdrop-blur-sm">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-1">Service en cours de déploiement</h3>
                <p className="text-white/80 text-sm">
                  Les trajets disponibles s'afficheront ici une fois que des chauffeurs publient leurs trajets. En attendant, vous pouvez vous inscrire comme chauffeur pour proposer des trajets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
