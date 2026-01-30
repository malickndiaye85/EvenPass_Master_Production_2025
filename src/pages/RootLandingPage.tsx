import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Music, Bus, Ship } from 'lucide-react';
import { useLandingBackgrounds } from '../lib/landingBackgrounds';

export const RootLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { backgrounds, loading } = useLandingBackgrounds();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <h1 className="text-2xl font-display font-bold text-gray-900 tracking-tight">
            DEM⇄DEM
          </h1>
        </div>
        <p className="text-center text-gray-600 text-sm mt-1 font-display">
          Gënaa Wóor • Gënaa Gaaw • Gënaa Yomb
        </p>
      </header>

      <div className="flex-1 flex flex-col md:flex-row mt-20 md:mt-0">
        <div
          className="relative flex-1 min-h-[50vh] md:min-h-screen flex items-center justify-center cursor-pointer group overflow-hidden"
          style={{
            backgroundImage: `url(${backgrounds.express})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={() => navigate('/voyage')}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 text-center text-white space-y-8 p-8 transform group-hover:scale-105 transition-transform duration-300">
            <div className="flex justify-center gap-6 mb-8">
              <Bus size={56} strokeWidth={1.5} className="animate-pulse" />
              <Ship size={56} strokeWidth={1.5} className="animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>

            <h2 className="text-5xl md:text-6xl font-display font-black tracking-tight">
              DEM EXPRESS
            </h2>

            <p className="text-2xl text-green-400 font-semibold">
              Navette Express • Ferry • Allo Dakar
            </p>

            <div className="pt-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg">
                <span className="text-sm font-medium">Cliquez pour explorer</span>
                <span className="text-xl">→</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        <div
          className="relative flex-1 min-h-[50vh] md:min-h-screen flex items-center justify-center cursor-pointer group overflow-hidden"
          style={{
            backgroundImage: `url(${backgrounds.evenement})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={() => navigate('/evenement')}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 text-center text-white space-y-8 p-8 transform group-hover:scale-105 transition-transform duration-300">
            <div className="flex justify-center gap-6 mb-8">
              <Ticket size={56} strokeWidth={1.5} className="animate-pulse" />
              <Music size={56} strokeWidth={1.5} className="animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>

            <h2 className="text-5xl md:text-6xl font-display font-black tracking-tight">
              DEM ÉVÉNEMENT
            </h2>

            <p className="text-2xl text-orange-300 font-semibold">
              Concerts • Théâtre • Sport
            </p>

            <div className="pt-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 rounded-lg">
                <span className="text-sm font-medium">Cliquez pour découvrir</span>
                <span className="text-xl">→</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
