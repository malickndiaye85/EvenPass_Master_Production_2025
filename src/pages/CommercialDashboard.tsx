import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, TrendingUp, DollarSign, Users, LogOut, Calendar, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { getVoyageStats, getMaritimeUser, VESSELS } from '../lib/maritimeData';
import type { VoyageStats } from '../types/maritime';
import DynamicLogo from '../components/DynamicLogo';

export default function CommercialDashboard() {
  const navigate = useNavigate();
  const { firebaseUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState('all');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState<VoyageStats[]>([]);

  useEffect(() => {
    loadUserData();
  }, [firebaseUser]);

  useEffect(() => {
    if (selectedVessel !== 'all') {
      loadStats(selectedVessel);
    } else if (isAdmin) {
      loadAllStats();
    }
  }, [selectedVessel, startDate, endDate]);

  const loadUserData = async () => {
    try {
      if (!firebaseUser) {
        navigate('/');
        return;
      }

      if (firebaseUser.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3') {
        setIsAdmin(true);
        setLoading(false);
        loadAllStats();
        return;
      }

      const maritimeUser = await getMaritimeUser(firebaseUser.uid);

      if (!maritimeUser || maritimeUser.role !== 'commercial') {
        alert('Accès refusé. Réservé au personnel commercial.');
        navigate('/');
        return;
      }

      if (!maritimeUser.vessel_id) {
        alert('Aucun navire assigné. Contactez l\'administrateur.');
        navigate('/');
        return;
      }

      setSelectedVessel(maritimeUser.vessel_id);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadStats = async (vesselId: string) => {
    try {
      const data = await getVoyageStats(vesselId, startDate, endDate);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAllStats = async () => {
    try {
      const allStats = await Promise.all(
        VESSELS.map(v => getVoyageStats(v.id, startDate, endDate))
      );
      setStats(allStats.flat());
    } catch (error) {
      console.error('Error loading all stats:', error);
    }
  };

  const handleLogout = () => {
    if (confirm('Déconnexion?')) {
      logout();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalRevenue = stats.reduce((sum, s) => sum + s.total_revenue, 0);
  const totalPassengers = stats.reduce((sum, s) => sum + s.passengers_boarded, 0);
  const avgFillRate = stats.length > 0 ? stats.reduce((sum, s) => sum + s.fill_rate, 0) / stats.length : 0;
  const totalCargo = stats.reduce((sum, s) => sum + s.cargo_weight, 0);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <DynamicLogo />
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all ${
                  isDark
                    ? 'bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Commercial Performance
              </h1>
              <p className={`text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Analyse de Rentabilité
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <h2 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Calendar className="w-5 h-5 inline mr-2" />
            Filtres
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {isAdmin && (
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Navire
                </label>
                <select
                  value={selectedVessel}
                  onChange={(e) => setSelectedVessel(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">Tous les navires</option>
                  {VESSELS.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date Début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <DollarSign className={`w-8 h-8 mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Revenus Total</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {(totalRevenue / 1000000).toFixed(1)}M
            </p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Users className={`w-8 h-8 mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Passagers</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalPassengers}</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <TrendingUp className={`w-8 h-8 mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Taux de Remplissage</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{avgFillRate.toFixed(0)}%</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Ship className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fret Total</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{(totalCargo / 1000).toFixed(1)}t</p>
          </div>
        </div>

        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <h2 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Détails des Voyages
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Date</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Passagers</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Taux</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rev. Passagers</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rev. Fret</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(stat.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {stat.passengers_boarded} / {stat.total_capacity}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        stat.fill_rate >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        stat.fill_rate >= 50 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {stat.fill_rate.toFixed(0)}%
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {(stat.revenue_passengers / 1000).toFixed(0)}K FCFA
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {(stat.revenue_cargo / 1000).toFixed(0)}K FCFA
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {(stat.total_revenue / 1000).toFixed(0)}K FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
