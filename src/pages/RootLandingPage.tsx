/**
 * ROOT LANDING PAGE DEM⇄DEM
 * Split-Screen: Voyage (Bleu) | Événement (Orange/Noir)
 * Mobile: Vertical 45vh chaque / Desktop: Horizontal 50/50
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Plane, Ticket, Music } from 'lucide-react';
import { VideoLogo } from '../components/VideoLogo';

export const RootLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <VideoLogo height={60} className="max-w-xs mx-auto" />
        <h2 className="text-center text-gray-600 text-sm mt-2 font-display">
          Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw
        </h2>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <div
          className="relative h-[45vh] md:h-auto md:flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:brightness-110 group"
          style={{ backgroundColor: '#0A1628' }}
          onClick={() => navigate('/voyage')}
        >
          <div className="text-center text-white z-10 space-y-6">
            <div className="flex justify-center gap-4 mb-6">
              <Bus size={48} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              <Plane size={48} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              DEM VOYAGE
            </h1>

            <p className="text-xl text-emerald-400 font-medium">
              Covoiturage • Express • Ferry
            </p>

            <button className="mt-8 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto">
              Explorer
              <span>→</span>
            </button>
          </div>

          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none"
          />
        </div>

        <div
          className="relative h-[45vh] md:h-auto md:flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:brightness-110 group"
          style={{ backgroundColor: '#1A1A1A' }}
          onClick={() => navigate('/evenement')}
        >
          <div className="text-center text-white z-10 space-y-6">
            <div className="flex justify-center gap-4 mb-6">
              <Ticket size={48} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              <Music size={48} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              DEM ÉVÉNEMENT
            </h1>

            <p className="text-xl text-orange-400 font-medium">
              Concerts • Théâtre • Sport
            </p>

            <button className="mt-8 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto">
              Découvrir
              <span>→</span>
            </button>
          </div>

          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
