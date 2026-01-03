import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Ship, Calendar, Users, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';

const PassLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [hoveredSide, setHoveredSide] = useState<'even' | 'pass' | null>(null);

  const handleEvenClick = () => {
    navigate('/');
  };

  const handlePassClick = () => {
    navigate('/pass/services');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'} relative overflow-hidden`}>
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Logo size="md" variant="default" />
              <div className="flex items-center gap-4">
                <button
                  onClick={handleEvenClick}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isDark
                      ? 'text-amber-400 hover:bg-amber-400/10'
                      : 'text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  EVEN
                </button>
                <button
                  onClick={handlePassClick}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isDark
                      ? 'text-cyan-400 hover:bg-cyan-400/10'
                      : 'text-[#0A7EA3] hover:bg-[#E6F1F5]'
                  }`}
                >
                  PASS
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  isDark ? 'bg-gray-800 text-amber-400' : 'bg-gray-100 text-gray-700'
                }`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isDark
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                Connexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 min-h-screen flex flex-col">
        <div className="flex-1 grid lg:grid-cols-2 grid-cols-1">
          <div
            className={`relative transition-all duration-500 cursor-pointer ${
              hoveredSide === 'even' ? 'lg:scale-105' : hoveredSide === 'pass' ? 'lg:scale-95' : ''
            }`}
            onMouseEnter={() => setHoveredSide('even')}
            onMouseLeave={() => setHoveredSide(null)}
            onClick={handleEvenClick}
          >
            <div className={`h-full min-h-[600px] lg:min-h-screen flex flex-col items-center justify-center p-12 relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-orange-900/20 via-gray-900 to-amber-900/20'
                : 'bg-gradient-to-br from-orange-50 via-white to-amber-50'
            }`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10 text-center max-w-lg">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${
                  isDark ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-orange-500 to-amber-600'
                } mb-8 shadow-2xl`}>
                  <Ticket className="w-10 h-10 text-white" />
                </div>

                <h1 className={`text-6xl font-black mb-6 ${
                  isDark
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600'
                }`}>
                  EVEN
                </h1>

                <p className={`text-3xl font-bold mb-4 ${isDark ? 'text-amber-400' : 'text-orange-600'}`}>
                  Gënaa Yomb
                </p>

                <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Découvrez et réservez vos billets pour les meilleurs événements au Sénégal
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
                    <Calendar className={`w-6 h-6 mb-2 ${isDark ? 'text-amber-400' : 'text-orange-600'}`} />
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Événements
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
                    <Users className={`w-6 h-6 mb-2 ${isDark ? 'text-amber-400' : 'text-orange-600'}`} />
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Communauté
                    </p>
                  </div>
                </div>

                <button className={`group px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all transform hover:scale-105 shadow-2xl ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
                }`}>
                  Explorer les événements
                  <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>

              <div className={`absolute bottom-8 left-0 right-0 text-center ${isDark ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>
                Marketplace Événementielle
              </div>
            </div>
          </div>

          <div
            className={`relative transition-all duration-500 cursor-pointer ${
              hoveredSide === 'pass' ? 'lg:scale-105' : hoveredSide === 'even' ? 'lg:scale-95' : ''
            }`}
            onMouseEnter={() => setHoveredSide('pass')}
            onMouseLeave={() => setHoveredSide(null)}
            onClick={handlePassClick}
          >
            <div className={`h-full min-h-[600px] lg:min-h-screen flex flex-col items-center justify-center p-12 relative overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-cyan-900/20 via-gray-900 to-blue-900/20'
                : 'bg-gradient-to-br from-[#E6F1F5] via-white to-[#B3D9E6]'
            }`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 right-20 w-72 h-72 bg-[#0A7EA3] rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10 text-center max-w-lg">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${
                  isDark ? 'bg-gradient-to-br from-cyan-400 to-[#0A7EA3]' : 'bg-gradient-to-br from-[#0A7EA3] to-[#005975]'
                } mb-8 shadow-2xl`}>
                  <Ship className="w-10 h-10 text-white" />
                </div>

                <h1 className={`text-6xl font-black mb-6 ${
                  isDark
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#0A7EA3]'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-[#0A7EA3] to-[#005975]'
                }`}>
                  PASS
                </h1>

                <p className={`text-3xl font-bold mb-4 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                  Gënaa Gaaw
                </p>

                <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Votre mobilité maritime et terrestre simplifiée
                </p>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
                    <Ship className={`w-5 h-5 mb-2 mx-auto ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      LMDG
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
                    <Ship className={`w-5 h-5 mb-2 mx-auto ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      COSAMA
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm`}>
                    <Ticket className={`w-5 h-5 mb-2 mx-auto ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cars
                    </p>
                  </div>
                </div>

                <button className={`group px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all transform hover:scale-105 shadow-2xl ${
                  isDark
                    ? 'bg-gradient-to-r from-cyan-400 to-[#0A7EA3] hover:from-cyan-500 hover:to-[#006B8C]'
                    : 'bg-gradient-to-r from-[#0A7EA3] to-[#005975] hover:from-[#006B8C] hover:to-[#00475E]'
                }`}>
                  Réserver un ticket
                  <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>

              <div className={`absolute bottom-8 left-0 right-0 text-center ${isDark ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>
                Mobilité Maritime & Terrestre
              </div>
            </div>
          </div>
        </div>

        <div className={`py-8 text-center border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <p className={`text-2xl font-bold ${
            isDark
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-400 to-orange-500'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-[#0A7EA3] to-amber-600'
          }`}>
            Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Événements • Services • Mobilité
          </p>
        </div>

        <footer className={`py-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                © 2026 EvenPass. Tous droits réservés.
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="w-3 h-3 rounded-full bg-gray-400 hover:bg-gray-600 transition-colors"
                  title="Admin Finance"
                  onClick={() => navigate('/admin/finance/login')}
                ></button>
                <button
                  className="w-3 h-3 rounded-full bg-gray-400 hover:bg-gray-600 transition-colors"
                  title="Admin Ops"
                  onClick={() => navigate('/admin/ops/login')}
                ></button>
                <button
                  className="w-3 h-3 rounded-full bg-gray-400 hover:bg-gray-600 transition-colors"
                  title="EPscan"
                  onClick={() => navigate('/scan/login')}
                ></button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PassLandingPage;
