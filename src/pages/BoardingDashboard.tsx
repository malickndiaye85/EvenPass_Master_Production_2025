import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Scan, Ship, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useTheme } from '../context/ThemeContext';
import { getTicketsByVessel, updateTicketStatus, getMaritimeUser, VESSELS } from '../lib/maritimeData';
import type { PassTicket } from '../types/maritime';
import DynamicLogo from '../components/DynamicLogo';

export default function BoardingDashboard() {
  const navigate = useNavigate();
  const { firebaseUser, logout } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [vesselId, setVesselId] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState<PassTicket[]>([]);
  const [boardedPassengers, setBoardedPassengers] = useState<PassTicket[]>([]);

  useEffect(() => {
    loadUserData();
  }, [firebaseUser]);

  const loadUserData = async () => {
    try {
      if (!firebaseUser) {
        navigate('/');
        return;
      }

      const maritimeUser = await getMaritimeUser(firebaseUser.uid);

      if (!maritimeUser || maritimeUser.role !== 'accueil') {
        alert('Accès refusé. Réservé au personnel d\'accueil.');
        navigate('/');
        return;
      }

      if (!maritimeUser.vessel_id) {
        alert('Aucun navire assigné. Contactez l\'administrateur.');
        navigate('/');
        return;
      }

      setVesselId(maritimeUser.vessel_id);
      setVesselName(maritimeUser.vessel_name || '');
      loadPassengerData(maritimeUser.vessel_id, selectedDate);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPassengerData = async (vId: string, date: string) => {
    try {
      const tickets = await getTicketsByVessel(vId, date);
      setPassengers(tickets);
      setBoardedPassengers(tickets.filter(t => t.status === 'boarded'));
    } catch (error) {
      console.error('Error loading passenger data:', error);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadPassengerData(vesselId, date);
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

  const vessel = VESSELS.find(v => v.id === vesselId);
  const cabineCount = passengers.filter(p => p.category === 'Cabine' && p.status === 'boarded').length;
  const pullmanCount = passengers.filter(p => p.category === 'Pullman' && p.status === 'boarded').length;
  const standardCount = passengers.filter(p => p.category === 'Standard' && p.status === 'boarded').length;
  const totalBoarded = boardedPassengers.length;
  const fillRate = vessel ? (totalBoarded / vessel.capacity_passengers) * 100 : 0;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`}>
      <nav className={`${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <DynamicLogo />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-[#0A7EA3] flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Boarding Management
              </h1>
              <p className={`text-lg ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                {vesselName}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <h2 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Calendar className="w-5 h-5 inline mr-2" />
            Sélectionner la Date
          </h2>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`px-4 py-3 rounded-xl border ${
              isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Users className={`w-8 h-8 mb-2 ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Embarqués</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalBoarded}</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Ship className={`w-8 h-8 mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cabine</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{cabineCount}</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Ship className={`w-8 h-8 mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pullman</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{pullmanCount}</p>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Ship className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Standard</p>
            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{standardCount}</p>
          </div>
        </div>

        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Liste des Passagers Embarqués
            </h2>
            <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}`}>
              <p className={`text-sm font-bold ${isDark ? 'text-cyan-400' : 'text-[#0A7EA3]'}`}>
                Taux de Remplissage: {fillRate.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Billet</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nom</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Téléphone</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Catégorie</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Heure</th>
                  <th className={`px-4 py-3 text-left text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {boardedPassengers.map((passenger) => (
                  <tr key={passenger.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`px-4 py-3 text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {passenger.ticket_number}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {passenger.passenger_name}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {passenger.passenger_phone}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        passenger.category === 'Cabine' ? 'bg-amber-500/20 text-amber-400' :
                        passenger.category === 'Pullman' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {passenger.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {passenger.boarded_at ? new Date(passenger.boarded_at.seconds * 1000).toLocaleTimeString('fr-FR') : 'N/A'}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Scan className="w-4 h-4" />
                        Embarqué
                      </span>
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
