/**
 * VOYAGE LANDING PAGE - Design Banque de Luxe
 * Univers DEM VOYAGE avec 3 modules principaux
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bus, Ship, CreditCard, User, ArrowRight } from 'lucide-react';

export const VoyageLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-950 shadow-lg py-5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="text-2xl font-display font-bold text-white cursor-pointer tracking-tight hover:text-amber-300 transition-colors"
            onClick={() => navigate('/')}
          >
            DEM⇄DEM
          </div>

          <div className="flex gap-4">
            <button
              className="px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-medium text-sm hover:bg-white/20 transition-all flex items-center gap-2 backdrop-blur-sm"
              onClick={() => navigate('/voyage/wallet')}
            >
              <CreditCard size={18} />
              SAMA PASS
            </button>
            <button
              className="px-5 py-2.5 bg-amber-400 text-blue-950 rounded-lg font-semibold text-sm hover:bg-amber-300 transition-all flex items-center gap-2"
              onClick={() => navigate('/voyage/conducteur/dashboard')}
            >
              <User size={18} />
              Espace Chauffeur
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-blue-950 mb-5 tracking-tight">
            Voyagez avec Excellence
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Choisissez votre mode de transport privilégié
          </p>
        </div>

        <div className="space-y-5">
          <div
            className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/voyage/allo-dakar')}
          >
            <div className="flex items-start gap-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Car size={36} className="text-blue-950" strokeWidth={1.5} />
              </div>

              <div className="flex-1">
                <h3 className="text-3xl font-display font-bold text-blue-950 mb-3 tracking-tight">
                  ALLO DAKAR
                </h3>
                <p className="text-gray-600 text-lg mb-5 leading-relaxed">
                  Covoiturage entre particuliers pour tous vos trajets au Sénégal
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-950 text-white rounded-lg text-sm font-medium group-hover:bg-blue-900 transition-colors">
                  Covoiturage National
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/voyage/express')}
          >
            <div className="flex items-start gap-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Bus size={36} className="text-blue-950" strokeWidth={1.5} />
              </div>

              <div className="flex-1">
                <h3 className="text-3xl font-display font-bold text-blue-950 mb-3 tracking-tight">
                  DEM-DEM EXPRESS
                </h3>
                <p className="text-gray-600 text-lg mb-2 leading-relaxed">
                  Navettes avec abonnement SAMA PASS
                </p>
                <p className="text-sm text-amber-600 font-semibold mb-5">
                  Keur Massar ⇄ Dakar
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-950 text-white rounded-lg text-sm font-medium group-hover:bg-blue-900 transition-colors">
                  Voir les lignes
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/voyage/ferry')}
          >
            <div className="flex items-start gap-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Ship size={36} className="text-blue-950" strokeWidth={1.5} />
              </div>

              <div className="flex-1">
                <h3 className="text-3xl font-display font-bold text-blue-950 mb-3 tracking-tight">
                  DEM ZIGUINCHOR
                </h3>
                <p className="text-gray-600 text-lg mb-5 leading-relaxed">
                  Ferry maritime Dakar ⇄ Ziguinchor avec COSAMA
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-950 text-white rounded-lg text-sm font-medium group-hover:bg-blue-900 transition-colors">
                  Réserver votre traversée
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl p-12 text-white shadow-2xl border border-amber-400/20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-block px-4 py-1.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mb-4 border border-amber-400/30">
                OFFRE PREMIUM
              </div>
              <h2 className="text-4xl font-display font-bold mb-5 tracking-tight">
                SAMA PASS
              </h2>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Abonnements illimités pour vos trajets quotidiens. Économisez jusqu'à 40% sur vos déplacements et voyagez en toute sérénité.
              </p>
              <button
                className="px-8 py-4 bg-amber-400 text-blue-950 font-bold rounded-xl hover:bg-amber-300 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3"
                onClick={() => navigate('/voyage/express')}
              >
                Découvrir les Pass
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="w-72 h-48 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xl">
              <CreditCard size={72} className="text-amber-300/80" strokeWidth={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
