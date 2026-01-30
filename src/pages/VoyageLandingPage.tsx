/**
 * VOYAGE LANDING PAGE - Design Banque de Luxe
 * Univers DEM VOYAGE avec 3 modules principaux
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bus, Ship, CreditCard, User, ArrowRight, MapPin, Calendar, Search } from 'lucide-react';

export const VoyageLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2942] to-[#0A1628]">
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
              onClick={() => navigate('/voyage/chauffeur/login')}
            >
              <User size={18} />
              Espace Chauffeur
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-5 tracking-tight">
            Voyagez avec Excellence
          </h1>
          <p className="text-xl text-white/70 font-light">
            Choisissez votre mode de transport privilégié
          </p>
        </div>

        <div className="mb-12 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
              <input
                type="text"
                placeholder="Départ"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
              <input
                type="text"
                placeholder="Destination"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button
            className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            onClick={() => navigate('/voyage/recherche-trajets')}
          >
            <Search size={20} />
            Rechercher un trajet
          </button>
        </div>

        <div className="space-y-5">
          <div
            className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl p-8 md:p-10 border-2 border-white/10 shadow-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:border-[#10B981]/50 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/voyage/recherche-trajets')}
          >
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                <svg className="w-10 h-10 text-[#10B981]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 17H19M5 17C5 18.1046 4.10457 19 3 19C1.89543 19 1 18.1046 1 17C1 15.8954 1.89543 15 3 15M5 17C5 15.8954 5.89543 15 7 15M19 17C19 18.1046 19.8954 19 21 19C22.1046 19 23 18.1046 23 17C23 15.8954 22.1046 15 21 15M19 17C19 15.8954 18.1046 15 17 15M7 15H17M7 15V11M17 15V11M7 11H10M7 11H5L3 9L5 5H9L11 7M17 11H14M17 11H19L21 9L19 5H15L13 7M10 11H14M10 11V7M14 11V7M10 7H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                    ALLO DAKAR
                  </h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold rounded-full shadow-lg">
                    Covoiturage Rapide
                  </span>
                </div>
                <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
                  Covoiturage entre particuliers pour tous vos trajets au Sénégal. Économique, convivial et écologique.
                </p>
                <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  Rechercher un trajet
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl p-8 md:p-10 border-2 border-white/10 shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:border-amber-400/50 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/voyage/express')}
          >
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                <Bus size={40} className="text-amber-400" strokeWidth={2} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                    DEM-DEM EXPRESS
                  </h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                    Exclusif Abonnés SAMA PASS
                  </span>
                </div>
                <p className="text-white/80 text-base md:text-lg mb-2 leading-relaxed">
                  Navettes confortables avec abonnement mensuel illimité
                </p>
                <p className="text-sm text-amber-300 font-semibold mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                  Keur Massar ⇄ Dakar
                </p>
                <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-blue-950 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  Voir les lignes
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl p-8 md:p-10 border-2 border-white/10 shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:border-blue-400/50 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/voyage/ferry')}
          >
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                <Ship size={40} className="text-blue-400" strokeWidth={2} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                    DEM ZIGUINCHOR
                  </h3>
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                    Ferry COSAMA
                  </span>
                </div>
                <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
                  Traversée maritime Dakar ⇄ Ziguinchor en toute sécurité avec la compagnie COSAMA
                </p>
                <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  Réserver votre traversée
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
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
