import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Clock, MapPin, Zap, ArrowRight } from 'lucide-react';

interface NavigationCardProps {
  hasSubscription: boolean;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({ hasSubscription }) => {
  const navigate = useNavigate();
  const [timeToArrival, setTimeToArrival] = useState(8);
  const [nextBusTime, setNextBusTime] = useState('07:15');

  useEffect(() => {
    if (!hasSubscription) return;

    const interval = setInterval(() => {
      setTimeToArrival(prev => {
        if (prev <= 1) return 15;
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [hasSubscription]);

  const handleGoClick = () => {
    if (hasSubscription) {
      navigate('/voyage/express/live');
    } else {
      navigate('/voyage/express');
    }
  };

  return (
    <div
      className="rounded-3xl p-8 md:p-10 border-2 border-emerald-500/30 shadow-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:border-emerald-500/60 transition-all duration-300 cursor-pointer group mb-5 relative overflow-hidden"
      onClick={handleGoClick}
      style={{
        backgroundImage: 'url(https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l-bus+10B981(-17.3829,14.7845)/-17.3829,14.7845,12,0/800x400@2x?access_token=pk.eyJ1IjoiZGVtZGVtIiwiYSI6ImNsdHBya3BtajBjdHMyam55NHpqaDRjb3QifQ.example)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-blue-900/90 to-blue-950/85 backdrop-blur-[2px]" />

      <div className="absolute top-4 left-8 z-10">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/30 backdrop-blur-md rounded-full border border-emerald-400/40 shadow-lg">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
          <span className="text-emerald-300 font-bold text-xs tracking-wide uppercase">
            {hasSubscription ? 'Navigation Active' : 'Transport Express'}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 relative z-10">
        <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/30 transition-all duration-300 border border-white/30 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Navigation size={40} className="text-emerald-400 relative z-10" strokeWidth={2} />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              GO - Mon Trajet en Temps Réel
            </h3>
            {hasSubscription && (
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                LIVE
              </span>
            )}
          </div>

          <p className="text-white/80 text-base md:text-lg mb-2 leading-relaxed">
            {hasSubscription
              ? 'Suivez votre navette en live et préparez votre SAMA PASS'
              : 'Suivez votre navette en live'}
          </p>

          {hasSubscription && (
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <p className="text-sm text-emerald-300 font-semibold flex items-center gap-2">
                <MapPin size={14} className="animate-pulse" />
                Ligne Express : Keur Massar ⇄ Plateau
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-lg border border-emerald-400/30">
                <Clock size={14} className="text-emerald-300" />
                <span className="text-emerald-200 font-bold text-sm">
                  Prochain bus : {nextBusTime}
                </span>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="relative h-40 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl border border-white/30 overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 300 160" className="opacity-50">
                  <path
                    d="M 30 130 Q 80 90, 150 75 T 270 20"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray="10,5"
                  />
                  <circle cx="30" cy="130" r="6" fill="#10B981" className="animate-pulse" />
                  <circle cx="270" cy="20" r="6" fill="#F59E0B" className="animate-pulse" />
                </svg>

                {hasSubscription && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-10 h-10 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/50 flex items-center justify-center"
                      style={{
                        animation: 'moveBus 5s ease-in-out infinite'
                      }}
                    >
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex justify-between text-xs text-white font-semibold">
                <div className="flex items-center gap-1 bg-emerald-500/90 px-2 py-1 rounded-lg">
                  <MapPin size={10} />
                  <span>Départ</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/90 px-2 py-1 rounded-lg">
                  <MapPin size={10} />
                  <span>Arrivée</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              {hasSubscription ? (
                <>
                  <div className="text-4xl font-black text-emerald-400 mb-2">{nextBusTime}</div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={18} className="text-emerald-400 animate-pulse" />
                    <span className="text-white/90 font-bold">Arrivée dans {timeToArrival} min</span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Navette approche. Préparez votre SAMA PASS.
                  </p>
                </>
              ) : (
                <div className="text-center md:text-left">
                  <h4 className="text-2xl font-black text-white mb-2">Planifiez votre trajet</h4>
                  <p className="text-white/70 text-sm">
                    Abonnez-vous pour suivre vos navettes en temps réel
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGoClick();
            }}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all group-hover:from-emerald-400 group-hover:to-teal-400"
          >
            {hasSubscription ? (
              <>
                <Navigation size={18} />
                GO - Voir mon trajet
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                S'abonner maintenant
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes moveBus {
          0%, 100% {
            transform: translate(-100px, 45px);
          }
          50% {
            transform: translate(100px, -45px);
          }
        }
      `}</style>
    </div>
  );
};
