/**
 * VOYAGE LANDING PAGE
 * Univers DEM VOYAGE avec 3 modules principaux
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bus, Ship, CreditCard, User } from 'lucide-react';

export const VoyageLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            className="text-2xl font-display font-bold text-blue-950 cursor-pointer"
            onClick={() => navigate('/')}
          >
            DEM⇄DEM
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-600 rounded-lg font-semibold text-sm hover:bg-emerald-100 transition-colors flex items-center gap-2"
              onClick={() => navigate('/voyage/wallet')}
            >
              <CreditCard size={16} />
              SAMA PASS
            </button>
            <button
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-600 rounded-lg font-semibold text-sm hover:bg-emerald-100 transition-colors flex items-center gap-2"
              onClick={() => navigate('/voyage/conducteur/dashboard')}
            >
              <User size={16} />
              Chauffeur Bii
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-blue-950 mb-4">
            Voyagez Malin
          </h1>
          <p className="text-lg text-slate-600">
            Choisissez votre mode de déplacement
          </p>
        </div>

        <div className="space-y-6">
          <div
            className="bg-white rounded-xl p-8 border-2 border-emerald-500 shadow-md hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate('/voyage/allo-dakar')}
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Car size={32} className="text-emerald-600" strokeWidth={1.5} />
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                  ALLO DAKAR
                </h3>
                <p className="text-slate-600 mb-4">
                  Covoiturage entre particuliers pour tous vos trajets au Sénégal
                </p>
                <div className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold">
                  Covoiturage National →
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-xl p-8 border-2 border-emerald-500 shadow-md hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate('/voyage/express')}
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Bus size={32} className="text-emerald-600" strokeWidth={1.5} />
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                  DEM-DEM EXPRESS
                </h3>
                <p className="text-slate-600 mb-2">
                  Navettes avec abonnement SAMA PASS
                </p>
                <p className="text-sm text-emerald-600 font-semibold mb-4">
                  🚌 Keur Massar ⇄ Dakar
                </p>
                <div className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold">
                  Voir les lignes →
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-xl p-8 border-2 border-emerald-500 shadow-md hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate('/voyage/ferry')}
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Ship size={32} className="text-emerald-600" strokeWidth={1.5} />
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                  DEM ZIGUINCHOR
                </h3>
                <p className="text-slate-600 mb-4">
                  Ferry maritime Dakar ⇄ Ziguinchor avec COSAMA
                </p>
                <div className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold">
                  Réserver →
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-display font-bold mb-4">
                SAMA PASS
              </h2>
              <p className="text-emerald-50 mb-6">
                Abonnements illimités pour vos trajets quotidiens. Économisez jusqu'à 40% sur vos déplacements.
              </p>
              <button
                className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                onClick={() => navigate('/voyage/express')}
              >
                Découvrir les Pass →
              </button>
            </div>

            <div className="w-64 h-40 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <CreditCard size={64} className="text-white/80" strokeWidth={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
