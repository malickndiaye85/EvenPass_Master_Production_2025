import { useNavigate } from 'react-router-dom';
import { Ticket, Bus, ArrowRight } from 'lucide-react';
import DynamicLogo from '../components/DynamicLogo';

export default function DemDemLandingPage() {
  const navigate = useNavigate();

  const handleEventClick = () => {
    navigate('/evenement');
  };

  const handleTransportClick = () => {
    navigate('/voyage');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
        <DynamicLogo size="lg" mode="auto" />
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        <div
          onClick={handleEventClick}
          className="flex-1 relative group cursor-pointer overflow-hidden transition-all duration-500 hover:flex-[1.1] bg-black"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#FF6B00]/20"></div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
            <div className="transform group-hover:scale-110 transition-all duration-500">
              <div className="bg-[#FF6B00] rounded-full p-8 mb-6 shadow-2xl group-hover:shadow-[#FF6B00]/50">
                <Ticket className="w-16 h-16 md:w-20 md:h-20" />
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              DEM ÉVÉNEMENT
            </h2>

            <p className="text-lg md:text-xl text-gray-300 mb-8 text-center px-6 max-w-md">
              Concerts, festivals, spectacles
            </p>

            <div className="flex items-center space-x-2 text-[#FF6B00] font-semibold group-hover:translate-x-2 transition-transform duration-300">
              <span>Voir les événements</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent"></div>
        </div>

        <div className="w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent hidden md:block"></div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent md:hidden"></div>

        <div
          onClick={handleTransportClick}
          className="flex-1 relative group cursor-pointer overflow-hidden transition-all duration-500 hover:flex-[1.1] bg-[#0A192F]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A192F] via-[#0A192F] to-[#10B981]/20"></div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
            <div className="transform group-hover:scale-110 transition-all duration-500">
              <div className="bg-[#10B981] rounded-full p-8 mb-6 shadow-2xl group-hover:shadow-[#10B981]/50">
                <Bus className="w-16 h-16 md:w-20 md:h-20" />
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              DEM VOYAGE
            </h2>

            <p className="text-lg md:text-xl text-gray-300 mb-8 text-center px-6 max-w-md">
              Bus, covoiturage, navettes
            </p>

            <div className="flex items-center space-x-2 text-[#10B981] font-semibold group-hover:translate-x-2 transition-transform duration-300">
              <span>Réserver un trajet</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A192F]/80 to-transparent"></div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center z-50">
        <p className="text-sm text-gray-400">
          Une seule app pour tout 🇸🇳
        </p>
      </div>
    </div>
  );
}
